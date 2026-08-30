/**
 * measure.mjs — the scoreboard.
 * Builds an app, serves the production bundle, runs Lighthouse N times under
 * fixed throttling, and reports the MEDIAN. Perf numbers are noisy; a single
 * run is not evidence.
 *
 * Usage: node harness/measure.mjs <appId> [runs]
 */
import { spawn } from 'node:child_process'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' }

export function buildApp (appId, baseDir = 'apps') {
  return new Promise((resolve, reject) => {
    const cfg = path.join(ROOT, baseDir, appId, 'vite.config.js')
    const p = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['vite', 'build', '--config', cfg, '--logLevel', 'error'],
      { cwd: ROOT, shell: process.platform === 'win32' })
    let err = ''
    p.stderr.on('data', d => { err += d })
    p.on('close', code => code === 0 ? resolve() : reject(new Error(`build failed for ${appId}:\n${err}`)))
  })
}

export function bundleBytes (appId, baseDir = 'apps') {
  const dir = path.join(ROOT, baseDir, appId, 'dist', 'assets')
  if (!fs.existsSync(dir)) return { jsKB: 0, totalKB: 0 }
  let js = 0, total = 0
  for (const f of fs.readdirSync(dir)) {
    const size = fs.statSync(path.join(dir, f)).size
    total += size
    if (f.endsWith('.js')) js += size
  }
  return { jsKB: +(js / 1024).toFixed(1), totalKB: +(total / 1024).toFixed(1) }
}

function serve (dir) {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0])
      let file = path.join(dir, urlPath === '/' ? 'index.html' : urlPath)
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dir, 'index.html')
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store' })
      fs.createReadStream(file).pipe(res)
    })
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }))
  })
}

const median = xs => {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export async function measure (appId, runs = 3, baseDir = 'apps') {
  await buildApp(appId, baseDir)
  const dist = path.join(ROOT, baseDir, appId, 'dist')
  const { server, port } = await serve(dist)
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  })
  const samples = []
  try {
    for (let i = 0; i < runs; i++) {
      const { lhr } = await lighthouse(`http://127.0.0.1:${port}/`, {
        port: chrome.port, output: 'json', logLevel: 'error',
        onlyCategories: ['performance'],
        // Default mobile preset: simulated 4G + 4x CPU slowdown. Fixed, so
        // results are comparable across machines in relative terms.
        formFactor: 'mobile', screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75 },
      })
      samples.push({
        score: Math.round(lhr.categories.performance.score * 100),
        fcp: Math.round(lhr.audits['first-contentful-paint'].numericValue),
        lcp: Math.round(lhr.audits['largest-contentful-paint'].numericValue),
        tbt: Math.round(lhr.audits['total-blocking-time'].numericValue),
        cls: +lhr.audits['cumulative-layout-shift'].numericValue.toFixed(3),
        si: Math.round(lhr.audits['speed-index'].numericValue),
      })
    }
  } finally {
    await chrome.kill()
    server.close()
  }
  const keys = ['score', 'fcp', 'lcp', 'tbt', 'cls', 'si']
  const result = { appId, runs, baseDir, bundle: bundleBytes(appId, baseDir), samples }
  for (const k of keys) result[k] = median(samples.map(s => s[k]))
  result.scoreSpread = Math.max(...samples.map(s => s.score)) - Math.min(...samples.map(s => s.score))
  return result
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('measure.mjs')) {
  const [appId, runs] = process.argv.slice(2)
  if (!appId) { console.error('usage: node harness/measure.mjs <appId> [runs]'); process.exit(1) }
  const r = await measure(appId, Number(runs) || 3)
  fs.mkdirSync(path.join(ROOT, 'results', 'raw'), { recursive: true })
  fs.writeFileSync(path.join(ROOT, 'results', 'raw', `${appId}-${Date.now()}.json`), JSON.stringify(r, null, 2))
  console.log(`\n${appId}  score=${r.score} (spread ±${r.scoreSpread})  FCP=${r.fcp}ms  LCP=${r.lcp}ms  TBT=${r.tbt}ms  CLS=${r.cls}  JS=${r.bundle.jsKB}KB`)
}
