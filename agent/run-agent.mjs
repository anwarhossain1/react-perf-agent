/**
 * THE AGENT - measure -> diagnose -> patch -> rebuild -> re-measure -> verify -> keep or revert.
 *
 * Design notes (these are the choices under test, one per changelog entry):
 *
 *  - The LOOP is code, not model-driven. The harness decides what "better" means
 *    and when to stop. The model is never asked to report its own score, so it
 *    cannot grade its own work.
 *  - MEASUREMENT is withheld from the model as a tool. It receives numbers the
 *    harness produced. This is the difference between "I think this is faster"
 *    and "this is faster".
 *  - Every round is ATOMIC. A round that fails to build, loses points, or breaks
 *    behaviour is reverted whole. The app can therefore never end worse than it
 *    started - the property a one-shot pass cannot offer.
 *  - One targeted change per round, so an improvement is attributable.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runClaude } from '../harness/run-claude.mjs'
import { prepareWorkdir } from '../harness/workdir.mjs'
import { measure } from '../harness/measure.mjs'
import { capture, compare } from '../harness/verify.mjs'
import { snapshot, restore } from '../harness/snapshot.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LABEL = process.env.AGENT_LABEL || 'agent'
const MAX_ROUNDS = Number(process.env.MAX_ROUNDS || 3)
// Ablation switches, so the changelog can attribute each component's effect.
const VERIFY_ON = process.env.VERIFY !== 'off'
const REVERT_ON = process.env.REVERT !== 'off'

const before = JSON.parse(fs.readFileSync(path.join(ROOT, 'results', 'before.json'), 'utf8'))
const only = process.argv[2]

const SYSTEM = [
  'You are a React performance engineer working on a Vite application.',
  'You make one focused, high-impact change at a time and you do not guess: the',
  'harness measures the result of every change you make and shows you the numbers',
  'on the next round.',
  '',
  'Rules that matter more than speed:',
  '- Preserve behaviour exactly. Every item the user could see or reach before must',
  '  still be reachable, filtering and interactions must return the same results,',
  '  and the page must scroll the same distance.',
  '- Never reduce the size of a dataset to make a metric look better.',
  '- Prefer changes that survive the bundler. Source-level tidiness that Rollup',
  '  already tree-shakes is not an optimisation.',
].join('\n')

function roundPrompt ({ m, round, history }) {
  const past = history.length
    ? '\nRounds so far:\n' + history.map((h) => '  ' + h.summary).join('\n') + '\n'
    : ''
  return [
    'Vite + React app. Current production build, measured by Lighthouse',
    '(mobile preset, simulated 4G, 4x CPU throttle):',
    '',
    '  Performance score : ' + m.score + '/100',
    '  First Contentful Paint : ' + m.fcp + ' ms',
    '  Largest Contentful Paint : ' + m.lcp + ' ms',
    '  Total Blocking Time : ' + m.tbt + ' ms',
    '  Cumulative Layout Shift : ' + m.cls,
    '  JavaScript bundle : ' + m.bundle.jsKB + ' KB',
    past,
    'Round ' + round + ' of ' + MAX_ROUNDS + '. Identify the single largest remaining',
    'cause of slowness in this codebase and fix it. Read the source before deciding -',
    'the bottleneck is not always where the metric points.',
    '',
    'Make ONE targeted change. Then reply with one line: what you changed and which',
    'metric you expect it to move. If you believe the app has no remaining significant',
    'performance problem, change nothing and reply exactly: NO-OP',
  ].join('\n')
}

const apps = Object.keys(before.apps).filter((a) => !only || a === only).sort()
const out = {
  label: LABEL,
  config: { MAX_ROUNDS, VERIFY_ON, REVERT_ON },
  measuredAt: new Date().toISOString(),
  apps: {},
}
const save = () => fs.writeFileSync(path.join(ROOT, 'results', LABEL + '.json'), JSON.stringify(out, null, 2))

for (const appId of apps) {
  console.log('\n[' + LABEL + '] ' + appId + '  (start ' + before.apps[appId].score + ')')
  const { dest, baseDir } = prepareWorkdir(appId, LABEL)

  // Reference behaviour comes from the pristine build, captured once.
  let reference = null
  if (VERIFY_ON) {
    try {
      reference = await capture(appId, 'apps')
    } catch (e) {
      console.log('  ! reference capture failed: ' + e.message)
    }
  }

  let current = before.apps[appId]
  const history = []
  let rounds = 0
  let kept = 0
  let reverted = 0
  let totalSeconds = 0

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    rounds = round
    const savedFiles = snapshot(dest)
    process.stdout.write('  round ' + round + ': patching ... ')
    const t0 = Date.now()
    const run = await runClaude({
      prompt: roundPrompt({ m: current, round, history }),
      cwd: dest,
      allowedTools: ['Read', 'Edit', 'Write', 'Glob', 'Grep'],
      systemPrompt: SYSTEM,
      trajectoryPath: path.join(ROOT, 'results', 'trajectories', LABEL + '-' + appId + '-r' + round + '.jsonl'),
    })
    const secs = Math.round((Date.now() - t0) / 1000)
    totalSeconds += secs
    const firstLine = (run.text || '').split('\n')[0].slice(0, 90)

    if (/^\s*NO-OP\s*$/im.test(run.text || '')) {
      console.log('model declared NO-OP (' + secs + 's) - stopping')
      history.push({ round, verdict: 'no-op', summary: 'round ' + round + ': no change proposed' })
      break
    }

    // --- gate 1: does it still build?
    let after = null
    let buildError = null
    try {
      after = await measure(appId, 3, baseDir)
    } catch (e) {
      buildError = String(e.message).slice(0, 200)
    }

    if (buildError) {
      console.log('BUILD FAILED (' + secs + 's) -> revert')
      if (REVERT_ON) {
        restore(dest, savedFiles)
        reverted++
      }
      history.push({ round, verdict: 'reverted-build', error: buildError, summary: 'round ' + round + ': build failed, reverted' })
      continue
    }

    // --- gate 2: did the number actually improve?
    const delta = after.score - current.score

    // --- gate 3: does the app still behave the same?
    let behaviour = { ok: true, diffs: [] }
    if (VERIFY_ON && reference) {
      try {
        behaviour = compare(reference, await capture(appId, baseDir))
      } catch (e) {
        behaviour = { ok: false, diffs: ['verification crashed: ' + e.message] }
      }
    }

    const bad = delta < 0 || !behaviour.ok
    if (bad && REVERT_ON) {
      restore(dest, savedFiles)
      reverted++
      const why = !behaviour.ok ? 'BROKE BEHAVIOUR (' + behaviour.diffs[0] + ')' : 'score ' + delta
      console.log(current.score + ' -> ' + after.score + ', ' + why + ' -> revert (' + secs + 's)')
      history.push({
        round, verdict: 'reverted', delta, diffs: behaviour.diffs,
        summary: 'round ' + round + ': ' + firstLine + ' -> rejected (' + why + ')',
      })
      continue
    }

    kept++
    current = after
    console.log('score -> ' + after.score + ' (' + (delta >= 0 ? '+' : '') + delta + ')  JS ' + after.bundle.jsKB + 'KB  kept (' + secs + 's)')
    history.push({
      round, verdict: bad ? 'kept-unguarded' : 'kept', delta, diffs: behaviour.diffs,
      summary: 'round ' + round + ': ' + firstLine + ' -> kept (' + (delta >= 0 ? '+' : '') + delta + ')',
    })
  }

  // Re-measure the working tree as it actually stands. With reverting disabled
  // (the ablation arm), `current` is the last GOOD measurement and no longer
  // describes what is on disk - a round that broke the build leaves a tree that
  // does not compile. Trusting `current` there would report the ablation as
  // healthier than it is.
  let finalError = null
  try {
    current = await measure(appId, 3, baseDir)
  } catch (e) {
    finalError = String(e.message).slice(0, 200)
    current = { ...current, score: 0, finalBuildFailed: true }
  }

  // Final state, verified once more.
  let finalBehaviour = { ok: true, diffs: [] }
  if (finalError) finalBehaviour = { ok: false, diffs: ['final tree does not build: ' + finalError] }
  if (reference && !finalError) {
    try {
      finalBehaviour = compare(reference, await capture(appId, baseDir))
    } catch (e) {
      finalBehaviour = { ok: false, diffs: [e.message] }
    }
  }
  out.apps[appId] = {
    appId, before: before.apps[appId], after: current,
    rounds, kept, reverted, seconds: totalSeconds, history, behaviour: finalBehaviour, finalError,
  }
  console.log('  = ' + before.apps[appId].score + ' -> ' + current.score +
    '  (' + kept + ' kept, ' + reverted + ' reverted)  behaviour ' +
    (finalBehaviour.ok ? 'OK' : 'BROKEN: ' + finalBehaviour.diffs[0]))
  save()
}

const done = Object.values(out.apps)
out.meanAfter = +(done.reduce((s, a) => s + a.after.score, 0) / done.length).toFixed(1)
out.behaviourBroken = done.filter((a) => !a.behaviour.ok).length
save()
console.log('\n=== ' + LABEL + ': mean ' + before.meanScore + ' -> ' + out.meanAfter +
  ', ' + out.behaviourBroken + '/' + done.length + ' behaviourally broken ===')
