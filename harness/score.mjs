/**
 * score.mjs - the final comparison table.
 *
 * PRIMARY METRIC: verified performance gain.
 *   A Lighthouse point only counts if the app still behaves the same afterwards.
 *   An arm that scores 100 by breaking the page scores zero here, which is the
 *   whole argument of this project.
 *
 * Usage: node harness/score.mjs <label> [label2 ...]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RESULTS = path.join(ROOT, 'results')
const labels = process.argv.slice(2)
if (!labels.length) {
  console.error('usage: node harness/score.mjs <label> [label2 ...]')
  process.exit(1)
}

const before = JSON.parse(fs.readFileSync(path.join(RESULTS, 'before.json'), 'utf8'))
const groundTruth = JSON.parse(fs.readFileSync(path.join(ROOT, 'harness', 'ground-truth.json'), 'utf8'))
const CONTROL = Object.entries(groundTruth.apps).filter(([, v]) => v.length === 0).map(([k]) => k)

const readJson = (f) => {
  const p = path.join(RESULTS, f)
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null
}

function summarise (label) {
  const run = readJson(label + '.json')
  if (!run) return null
  const behaviour = readJson(label + '-behaviour.json')
  const rows = []

  for (const appId of Object.keys(before.apps).sort()) {
    const b = before.apps[appId]
    const r = run.apps?.[appId]
    if (!r) continue
    const after = r.after
    const built = !!after && !r.error
    // Behaviour: prefer the standalone verification pass; fall back to in-run.
    const beh = behaviour?.apps?.[appId] ?? r.behaviour ?? { ok: null, diffs: [] }
    const raw = built ? after.score - b.score : 0
    // A gain only counts when behaviour survived. Unknown counts as not verified.
    const verified = built && beh.ok === true ? raw : 0
    rows.push({
      appId, isControl: CONTROL.includes(appId),
      beforeScore: b.score, afterScore: built ? after.score : null,
      raw, verified, built, behaviourOk: beh.ok, diffs: beh.diffs ?? [],
      beforeJs: b.bundle.jsKB, afterJs: built ? after.bundle.jsKB : null,
      seconds: r.seconds ?? r.editSeconds ?? null,
      rounds: r.rounds ?? 1, kept: r.kept ?? null, reverted: r.reverted ?? null,
    })
  }

  const scored = rows.filter((r) => !r.isControl)
  const control = rows.filter((r) => r.isControl)
  const n = scored.length || 1
  return {
    label,
    rows,
    buildFailures: rows.filter((r) => !r.built).length,
    broken: rows.filter((r) => r.behaviourOk === false).length,
    meanRawGain: +(scored.reduce((s, r) => s + r.raw, 0) / n).toFixed(1),
    meanVerifiedGain: +(scored.reduce((s, r) => s + r.verified, 0) / n).toFixed(1),
    // False positive: the control app was changed for the worse or broken.
    controlRegressions: control.filter((r) => !r.built || r.behaviourOk === false || r.raw < 0).length,
    controlCount: control.length,
    totalMinutes: +(rows.reduce((s, r) => s + (r.seconds || 0), 0) / 60).toFixed(1),
    totalReverted: rows.reduce((s, r) => s + (r.reverted || 0), 0),
  }
}

const arms = labels.map(summarise).filter(Boolean)
if (!arms.length) {
  console.error('no results found for: ' + labels.join(', '))
  process.exit(1)
}

const pct = (x, total) => total ? (100 * x / total).toFixed(0) + '%' : '-'
const md = []
md.push('# Results\n')
md.push('Eval set: ' + Object.keys(before.apps).length + ' Vite + React apps. Lighthouse mobile preset,')
md.push('simulated 4G + 4x CPU throttle, median of 3. Starting mean score **' + before.meanScore + '**.\n')
md.push('`' + CONTROL.join('`, `') + '` ' + (CONTROL.length === 1 ? 'is a negative control' : 'are negative controls') +
  ' - already optimal, so the correct action is to change nothing.\n')

md.push('## Headline\n')
md.push('| Metric | ' + arms.map((a) => a.label).join(' | ') + ' |')
md.push('|---|' + arms.map(() => '---').join('|') + '|')
md.push('| **Verified gain (primary)** | ' + arms.map((a) => '**+' + a.meanVerifiedGain + '**').join(' | ') + ' |')
md.push('| Raw gain, unverified | ' + arms.map((a) => '+' + a.meanRawGain).join(' | ') + ' |')
md.push('| Apps behaviourally broken | ' + arms.map((a) => a.broken + '/' + a.rows.length + ' (' + pct(a.broken, a.rows.length) + ')').join(' | ') + ' |')
md.push('| Build failures | ' + arms.map((a) => a.buildFailures + '/' + a.rows.length).join(' | ') + ' |')
md.push('| Control regressions (false positives) | ' + arms.map((a) => a.controlRegressions + '/' + a.controlCount).join(' | ') + ' |')
md.push('| Changes reverted by guard | ' + arms.map((a) => a.totalReverted || '-').join(' | ') + ' |')
md.push('| Wall-clock, whole eval set | ' + arms.map((a) => a.totalMinutes + ' min').join(' | ') + ' |')
md.push('')

for (const arm of arms) {
  md.push('## ' + arm.label + ' - per app\n')
  md.push('| App | Before | After | Raw | Verified | Behaviour | JS KB |')
  md.push('|---|---|---|---|---|---|---|')
  for (const r of arm.rows) {
    const beh = r.behaviourOk === true ? 'ok' : r.behaviourOk === false ? '**BROKEN** - ' + (r.diffs[0] || '') : 'not checked'
    md.push('| ' + r.appId + (r.isControl ? ' _(control)_' : '') + ' | ' + r.beforeScore + ' | ' +
      (r.afterScore ?? 'build failed') + ' | ' + (r.raw >= 0 ? '+' : '') + r.raw + ' | ' +
      (r.verified >= 0 ? '+' : '') + r.verified + ' | ' + beh + ' | ' +
      r.beforeJs + ' → ' + (r.afterJs ?? '-') + ' |')
  }
  md.push('')
}

const text = md.join('\n')
fs.writeFileSync(path.join(RESULTS, 'comparison.md'), text)
console.log(text)
console.log('\nwritten -> results/comparison.md')
