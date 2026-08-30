/**
 * verify.mjs - the correctness guard.
 *
 * A performance score means nothing if the app stopped working. This renders a
 * build in a real browser and captures behavioural invariants that a legitimate
 * optimisation must preserve.
 *
 * Two things make this harder than a DOM diff, and both are load-bearing:
 *
 *  1. Windowing a long list is a CORRECT fix that removes thousands of nodes,
 *     so node counts and whole-page innerText are useless - the optimised page
 *     legitimately contains less DOM than the original.
 *  2. Adding explicit width/height to images is the textbook CLS fix and it
 *     legitimately changes page height. v1 of this file gated on scroll height
 *     and flagged 4/10 correct fixes as breakage (see CHANGELOG Step 1b).
 *
 * What survives both: a CONTENT PROFILE. Scroll to 24 evenly spaced fractions of
 * the page and record what is under the viewport at each. If the page still holds
 * the same content in the same order, the element at 40% down is the same record
 * whether the page is 60,000 or 128,000 pixels tall, and whether the rows beyond
 * the viewport are mounted or windowed. If a dataset was silently shortened, the
 * profile diverges immediately.
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as chromeLauncher from 'chrome-launcher'
import puppeteer from 'puppeteer-core'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' }

const SAMPLES = 24
// Sub-pixel and boundary effects can shift one or two samples onto a neighbour.
const PROFILE_TOLERANCE = 2

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim()

function serve (dir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0])
      let file = path.join(dir, urlPath === '/' ? 'index.html' : urlPath)
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dir, 'index.html')
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' })
      fs.createReadStream(file).pipe(res)
    })
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }))
  })
}

export async function capture (appId, baseDir = 'apps') {
  const dist = path.join(ROOT, baseDir, appId, 'dist')
  if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('no build at ' + dist)
  const { server, port } = await serve(dist)
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  })
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:' + chrome.port,
    defaultViewport: { width: 412, height: 823 },
  })
  const errors = []
  try {
    const page = await browser.newPage()
    page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 200)))
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })

    await page.goto('http://127.0.0.1:' + port + '/', { waitUntil: 'networkidle0', timeout: 60000 })
    // Longer settle: some optimised builds commit the list progressively.
    await new Promise((r) => setTimeout(r, 2500))

    const title = await page.title()
    const headText = norm(await page.evaluate(() => document.body.innerText.slice(0, 700)))
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)

    // Content profile: what is on screen at each fraction of the page.
    const profile = []
    for (let i = 0; i < SAMPLES; i++) {
      const frac = i / (SAMPLES - 1)
      const sample = await page.evaluate(async (f) => {
        const h = document.documentElement.scrollHeight - window.innerHeight
        window.scrollTo(0, Math.round(h * f))
        await new Promise((r) => setTimeout(r, 200))
        // Cheap and windowing-proof: read what is literally under three points
        // of the viewport rather than walking the whole tree.
        const texts = []
        for (const yFrac of [0.25, 0.5, 0.75]) {
          let el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight * yFrac)
          // Climb to the nearest RECORD-like ancestor. A bare leaf can be a
          // single word (blind to content loss); climbing by text length instead
          // overshoots to the container holding every record, which makes all 24
          // samples identical and equally blind. The semantic boundary is the
          // one that identifies "which row am I looking at".
          const RECORD = 'li,tr,article,figure,section,p,h1,h2,h3'
          const hit = el
          for (let up = 0; el && el !== document.body && up < 6; up++) {
            if (el.matches && el.matches(RECORD)) break
            el = el.parentElement
          }
          if (!el || el === document.body) el = hit
          texts.push(el ? (el.textContent || '').slice(0, 160) : '')
        }
        return texts.join(' ~ ')
      }, frac)
      profile.push(norm(sample))
    }

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await new Promise((r) => setTimeout(r, 1500))
    const tailText = norm(await page.evaluate(() => document.body.innerText.slice(-700)))

    // Filtering, where the app offers it.
    let filterText = null
    const input = await page.$('input')
    if (input) {
      await page.evaluate(() => window.scrollTo(0, 0))
      await new Promise((r) => setTimeout(r, 400))
      await input.click()
      await input.type('Product 4321', { delay: 8 })
      await new Promise((r) => setTimeout(r, 1200))
      filterText = norm(await page.evaluate(() => document.body.innerText.slice(0, 700)))
    }
    // Button interaction, where the app offers it. Added after an agent rewrite
    // replaced React with pre-rendered HTML plus 6 KB of hand-written JS: the
    // text gates all passed because the markup was identical, and nothing in the
    // suite actually clicked the tabs. It turned out to work - but the suite had
    // no way of knowing that, which is the same as not checking.
    let buttonText = null
    const buttons = await page.$$('button')
    if (buttons.length > 1) {
      await page.evaluate(() => window.scrollTo(0, 0))
      await new Promise((r) => setTimeout(r, 300))
      await buttons[1].click()
      await new Promise((r) => setTimeout(r, 1200))
      buttonText = norm(await page.evaluate(() => document.body.innerText.slice(0, 700)))
    }

    return { appId, baseDir, title, headText, scrollHeight, profile, tailText, filterText, buttonText, errors }
  } finally {
    await browser.disconnect()
    await chrome.kill()
    server.close()
  }
}

export function compare (ref, cand) {
  const diffs = []
  const notes = []

  if (ref.title !== cand.title) diffs.push('title changed: "' + ref.title + '" -> "' + cand.title + '"')
  if (ref.headText !== cand.headText) diffs.push('above-the-fold text changed')
  if (ref.tailText !== cand.tailText) diffs.push('content at bottom of page changed')
  if (ref.filterText !== cand.filterText) diffs.push('filtering produced a different result')
  if (ref.buttonText !== cand.buttonText) diffs.push('clicking a control produced a different result')

  const newErrors = cand.errors.filter((e) => !ref.errors.includes(e))
  if (newErrors.length) diffs.push('new console errors: ' + newErrors.slice(0, 2).join(' | '))

  // Content completeness, robust to both windowing and layout-size changes.
  // Compared with an alignment tolerance of +/-1 sample. A correct fix can make
  // the page taller or shorter (image dimensions, text reflow) while the header
  // stays a fixed height, so the same record drifts to a neighbouring fraction.
  // Wholesale reordering or missing data still fails: it does not land within
  // one position.
  const n = Math.min(ref.profile?.length ?? 0, cand.profile?.length ?? 0)
  let mismatches = 0
  const examples = []
  for (let i = 0; i < n; i++) {
    const near = [ref.profile[i], ref.profile[i - 1], ref.profile[i + 1]].filter((x) => x !== undefined)
    if (!near.includes(cand.profile[i])) {
      mismatches++
      if (examples.length < 2) {
        examples.push(Math.round((100 * i) / (n - 1)) + '%: "' + ref.profile[i].slice(0, 50) +
          '" -> "' + cand.profile[i].slice(0, 50) + '"')
      }
    }
  }
  // INFORMATIONAL, not a gate. Three designs of this check were tried (raw
  // position, +/-1 alignment, record-ancestor climbing) and every one conflated
  // layout density with content identity: when sized images make each row
  // taller, three viewport probes land on the same record instead of three, and
  // the profile diverges while the content is intact. Adjudicated by hand
  // instead - see CHANGELOG Step 1b. Left in because a large divergence is still
  // worth a human look.
  if (n && mismatches > PROFILE_TOLERANCE) {
    notes.push('content profile diverged at ' + mismatches + '/' + n + ' positions (' +
      examples.join('; ') + ') - review, not treated as breakage')
  }

  // Informational only. Legitimate fixes (image dimensions, reflow) change this.
  const drift = ref.scrollHeight ? Math.abs(cand.scrollHeight - ref.scrollHeight) / ref.scrollHeight : 0
  if (drift > 0.05) {
    notes.push('page height changed ' + (drift * 100).toFixed(1) + '% (' +
      ref.scrollHeight + ' -> ' + cand.scrollHeight + 'px) - not treated as breakage')
  }

  return { ok: diffs.length === 0, diffs, notes }
}

if (process.argv[1]?.endsWith('verify.mjs')) {
  const [appId, baseDir] = process.argv.slice(2)
  const r = await capture(appId, baseDir || 'apps')
  console.log(JSON.stringify({ ...r, profile: r.profile.map((p) => p.slice(0, 60)) }, null, 2))
}
