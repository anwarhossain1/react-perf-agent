/**
 * BASELINE A - "one direct prompt with basic instructions".
 *
 * The canonical baseline shape from the brief, and the weakest reasonable way to
 * do this task: the source is pasted into a single model call, the model replies
 * with rewritten files, and the harness writes them out. No tools, no reading the
 * repo, no build, no measurement, no second attempt.
 *
 * RESOURCE DIFFERENCE (stated because the brief asks for it): this arm cannot
 * see files it was not handed, and any source file over INLINE_CAP is truncated
 * in the prompt. That is not a handicap imposed for effect - it is the actual
 * constraint of the approach. A 1.7 MB generated data module does not fit in a
 * prompt, which is precisely why one-shot prompting struggles on real codebases.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runClaude } from '../harness/run-claude.mjs'
import { prepareWorkdir } from '../harness/workdir.mjs'
import { measure } from '../harness/measure.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LABEL = 'simple'
const INLINE_CAP = 20000 // characters per file pasted into the prompt
const before = JSON.parse(fs.readFileSync(path.join(ROOT, 'results', 'before.json'), 'utf8'))
const only = process.argv[2]

function collectSources (dir) {
  const files = []
  const walk = (d, rel = '') => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'dist' || e.name === 'node_modules') continue
      const full = path.join(d, e.name)
      const r = rel ? rel + '/' + e.name : e.name
      if (e.isDirectory()) walk(full, r)
      else if (/\.(jsx?|css|html)$/.test(e.name)) files.push({ rel: r, text: fs.readFileSync(full, 'utf8') })
    }
  }
  walk(dir)
  return files
}

function buildPrompt (b, files) {
  const parts = [
    'This is a React application built with Vite. Its production build measures',
    'poorly in Lighthouse:',
    '',
    '  Performance score : ' + b.score + '/100',
    '  First Contentful Paint : ' + b.fcp + ' ms',
    '  Largest Contentful Paint : ' + b.lcp + ' ms',
    '  Total Blocking Time : ' + b.tbt + ' ms',
    '  Cumulative Layout Shift : ' + b.cls,
    '  JavaScript bundle : ' + b.bundle.jsKB + ' KB',
    '',
    'Make this application faster while keeping its visible behaviour and features',
    'identical.',
    '',
    'Reply with the complete new contents of every file you want to change, and',
    'nothing else. Use exactly this format for each file, with no code fences:',
    '',
    '<<<FILE path/relative/to/app>>>',
    '...complete file contents...',
    '<<<END>>>',
    '',
    'Here are the current source files:',
    '',
  ]
  for (const f of files) {
    const truncated = f.text.length > INLINE_CAP
    parts.push('<<<FILE ' + f.rel + '>>>')
    parts.push(truncated
      ? f.text.slice(0, INLINE_CAP) + '\n/* ...truncated, file is ' + f.text.length + ' characters total... */'
      : f.text)
    parts.push('<<<END>>>')
    parts.push('')
  }
  return parts.join('\n')
}

function applyEdits (text, dest) {
  const written = []
  const re = /<<<FILE\s+(.+?)>>>\r?\n([\s\S]*?)<<<END>>>/g
  let m
  while ((m = re.exec(text))) {
    const rel = m[1].trim()
    // Refuse anything escaping the app directory.
    const full = path.resolve(dest, rel)
    if (!full.startsWith(path.resolve(dest))) continue
    let body = m[2]
    if (/\.\.\.truncated/.test(body)) continue // model echoed our truncation marker
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, body.replace(/\s+$/, '') + '\n')
    written.push(rel)
  }
  return written
}

const apps = Object.keys(before.apps).filter((a) => !only || a === only).sort()
const out = { label: LABEL, inlineCap: INLINE_CAP, measuredAt: new Date().toISOString(), apps: {} }
const save = () => fs.writeFileSync(path.join(ROOT, 'results', LABEL + '.json'), JSON.stringify(out, null, 2))

for (const appId of apps) {
  const b = before.apps[appId]
  process.stdout.write('\n[simple] ' + appId + '\n  prompting ... ')
  const { dest, baseDir } = prepareWorkdir(appId, LABEL)
  const files = collectSources(dest)
  const prompt = buildPrompt(b, files)
  const t0 = Date.now()
  const run = await runClaude({
    prompt,
    cwd: dest,
    allowedTools: [], // no tools: this arm cannot read, build, or measure anything
    trajectoryPath: path.join(ROOT, 'results', 'trajectories', LABEL + '-' + appId + '.jsonl'),
  })
  const secs = Math.round((Date.now() - t0) / 1000)
  const written = applyEdits(run.text || '', dest)
  process.stdout.write(written.length + ' files rewritten, ' + secs + 's\n  measuring ... ')

  let after = null
  let error = null
  if (!written.length) {
    error = 'model produced no parseable file blocks'
  } else {
    try { after = await measure(appId, 3, baseDir) } catch (e) { error = String(e.message).slice(0, 300) }
  }
  out.apps[appId] = {
    appId, before: b, after, error, editSeconds: secs, rounds: 1,
    filesWritten: written, promptChars: prompt.length, turns: run.turns,
  }
  if (after) {
    const d = after.score - b.score
    console.log('score ' + b.score + ' -> ' + after.score + ' (' + (d >= 0 ? '+' : '') + d + ')  JS ' +
      b.bundle.jsKB + ' -> ' + after.bundle.jsKB + ' KB')
  } else {
    console.log('FAILED - ' + error)
  }
  save()
}

const done = Object.values(out.apps)
const built = done.filter((a) => a.after)
out.meanAfter = built.length ? +(built.reduce((s, a) => s + a.after.score, 0) / built.length).toFixed(1) : null
out.failures = done.length - built.length
save()
console.log('\n=== simple: mean ' + before.meanScore + ' -> ' + out.meanAfter +
  ' over ' + built.length + ' built, ' + out.failures + '/' + done.length + ' failed ===')
