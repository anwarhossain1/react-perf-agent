/**
 * BASELINE — "one general-purpose agent with basic tools" (a baseline shape the
 * hackathon brief lists explicitly).
 *
 * Deliberately identical to the agent in: model, source access, and the Lighthouse
 * report it is handed. Deliberately different in: no build tool, no re-measurement,
 * no verification, no revert. It edits once and stops. That isolates the agentic
 * loop as the single variable under test.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runClaude } from '../harness/run-claude.mjs'
import { prepareWorkdir } from '../harness/workdir.mjs'
import { measure } from '../harness/measure.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LABEL = 'baseline'
const before = JSON.parse(fs.readFileSync(path.join(ROOT, 'results', 'before.json'), 'utf8'))
const only = process.argv[2]

const promptFor = (b) => `This is a small React application built with Vite. Its production build
measures poorly in Lighthouse:

  Performance score : ${b.score}/100
  First Contentful Paint : ${b.fcp} ms
  Largest Contentful Paint : ${b.lcp} ms
  Total Blocking Time : ${b.tbt} ms
  Cumulative Layout Shift : ${b.cls}
  JavaScript bundle : ${b.bundle.jsKB} KB

Make this application faster. Edit the source files in place. Keep the app's
visible behaviour and features the same.`

const apps = Object.keys(before.apps).filter(a => !only || a === only).sort()
const out = { label: LABEL, measuredAt: new Date().toISOString(), apps: {} }

for (const appId of apps) {
  const b = before.apps[appId]
  process.stdout.write(`\n[baseline] ${appId}\n  editing … `)
  const { dest, baseDir } = prepareWorkdir(appId, LABEL)
  const t0 = Date.now()
  const run = await runClaude({
    prompt: promptFor(b),
    cwd: dest,
    allowedTools: ['Read', 'Edit', 'Write', 'Glob', 'Grep'],
    trajectoryPath: path.join(ROOT, 'results', 'trajectories', `${LABEL}-${appId}.jsonl`),
  })
  const editSeconds = Math.round((Date.now() - t0) / 1000)
  process.stdout.write(`${run.turns} turns, ${run.toolCalls.length} tool calls, ${editSeconds}s\n  measuring … `)

  let after = null, error = null
  try {
    after = await measure(appId, 3, baseDir)
  } catch (e) {
    error = String(e.message).slice(0, 300)
  }
  out.apps[appId] = {
    appId, before: b, after, error, editSeconds,
    turns: run.turns, toolCalls: run.toolCalls, costUsd: run.costUsd,
  }
  if (after) {
    const d = after.score - b.score
    console.log(`score ${b.score} → ${after.score} (${d >= 0 ? '+' : ''}${d})  JS ${b.bundle.jsKB} → ${after.bundle.jsKB} KB`)
  } else {
    console.log(`BUILD FAILED — ${error?.slice(0, 100)}`)
  }
  fs.writeFileSync(path.join(ROOT, 'results', `${LABEL}.json`), JSON.stringify(out, null, 2))
}

const done = Object.values(out.apps)
const built = done.filter(a => a.after)
out.meanAfter = built.length ? +(built.reduce((s, a) => s + a.after.score, 0) / built.length).toFixed(1) : null
out.buildFailures = done.length - built.length
fs.writeFileSync(path.join(ROOT, 'results', `${LABEL}.json`), JSON.stringify(out, null, 2))
console.log(`\n=== baseline: mean ${before.meanScore} → ${out.meanAfter}, ${out.buildFailures}/${done.length} build failures ===`)
