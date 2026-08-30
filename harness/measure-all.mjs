/** Measure every eval app and write a snapshot to results/<label>.json */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { measure } from './measure.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const label = process.argv[2] || 'snapshot'
const runs = Number(process.argv[3]) || 3

const apps = fs.readdirSync(path.join(ROOT, 'apps')).filter(a => a.startsWith('app-')).sort()
const out = { label, runs, measuredAt: new Date().toISOString(), apps: {} }

for (const appId of apps) {
  process.stdout.write(`measuring ${appId} … `)
  try {
    const r = await measure(appId, runs)
    out.apps[appId] = r
    console.log(`score=${r.score} (±${r.scoreSpread}) LCP=${r.lcp}ms TBT=${r.tbt}ms JS=${r.bundle.jsKB}KB`)
  } catch (e) {
    out.apps[appId] = { appId, error: String(e.message).slice(0, 400) }
    console.log(`FAILED — ${String(e.message).slice(0, 120)}`)
  }
}

const scores = Object.values(out.apps).filter(a => a.score != null).map(a => a.score)
out.meanScore = +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
fs.mkdirSync(path.join(ROOT, 'results'), { recursive: true })
fs.writeFileSync(path.join(ROOT, 'results', `${label}.json`), JSON.stringify(out, null, 2))
console.log(`\nmean score across ${scores.length} apps: ${out.meanScore}`)
console.log(`written → results/${label}.json`)
