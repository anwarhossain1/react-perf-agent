/**
 * Behavioural verification pass over a completed run.
 *
 * Kept separate from the runs themselves so that every arm - baseline included -
 * is judged on the same axes by the same code, after the fact. The baseline is
 * never told it will be checked; that is the point.
 *
 * Usage: node harness/verify-run.mjs <label>
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { capture, compare } from './verify.mjs'
import { buildApp } from './measure.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const label = process.argv[2]
if (!label) {
  console.error('usage: node harness/verify-run.mjs <label>')
  process.exit(1)
}

const runDir = path.join(ROOT, 'runs', label)
const apps = fs.readdirSync(runDir).filter((a) => a.startsWith('app-')).sort()
const out = { label, verifiedAt: new Date().toISOString(), apps: {} }

for (const appId of apps) {
  process.stdout.write(appId + ' ... ')
  try {
    // Reference is the pristine app; rebuild both so we compare current source.
    await buildApp(appId, 'apps')
    await buildApp(appId, path.join('runs', label))
    // Headless Chrome occasionally drops the connection mid-capture; one retry
    // distinguishes a flake from a real failure.
    const withRetry = async (fn) => {
      try { return await fn() } catch (e) {
        console.log('(retry after: ' + String(e.message).slice(0, 60) + ') ')
        return await fn()
      }
    }
    const reference = await withRetry(() => capture(appId, 'apps'))
    const candidate = await withRetry(() => capture(appId, path.join('runs', label)))
    const result = compare(reference, candidate)
    out.apps[appId] = { appId, ...result, reference, candidate }
    console.log(result.ok ? 'OK' : 'BROKEN - ' + result.diffs.join('; '))
  } catch (e) {
    out.apps[appId] = { appId, ok: false, diffs: ['verification failed: ' + String(e.message).slice(0, 200)] }
    console.log('ERROR - ' + String(e.message).slice(0, 120))
  }
  fs.writeFileSync(path.join(ROOT, 'results', label + '-behaviour.json'), JSON.stringify(out, null, 2))
}

const all = Object.values(out.apps)
out.brokenCount = all.filter((a) => !a.ok).length
fs.writeFileSync(path.join(ROOT, 'results', label + '-behaviour.json'), JSON.stringify(out, null, 2))
console.log('\n' + label + ': ' + out.brokenCount + '/' + all.length + ' apps behaviourally broken')
