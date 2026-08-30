/**
 * render-trajectory.mjs - turn raw stream-json into a readable trajectory.
 *
 * Deliverable #4 asks for trajectories that are easy to follow from the agent's
 * instructions through to the final result, including the feedback that shaped
 * the next step. Raw JSONL is ~1 MB per round and is not that, so each round is
 * rendered as markdown AND joined to the harness verdict that followed it - the
 * gate outcome (built? improved? still correct?) is the feedback, and it is
 * produced by the harness rather than the model.
 *
 * Usage: node harness/render-trajectory.mjs [label]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'results', 'trajectories')
const DEST = path.join(ROOT, 'results', 'trajectories-md')
const only = process.argv[2]

const clip = (s, n) => {
  const t = String(s ?? '').replace(/\r/g, '')
  return t.length > n ? t.slice(0, n) + '\n… [' + (t.length - n) + ' more characters]' : t
}

function parse (file) {
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)
    .map((l) => { try { return JSON.parse(l) } catch { return null } })
    .filter(Boolean)
}

// Harness verdicts, keyed by "<label>-<appId>-r<round>" where available.
function loadVerdicts () {
  const map = {}
  for (const f of fs.readdirSync(path.join(ROOT, 'results')).filter((f) => f.endsWith('.json'))) {
    let data
    try { data = JSON.parse(fs.readFileSync(path.join(ROOT, 'results', f), 'utf8')) } catch { continue }
    if (!data?.apps) continue
    const label = data.label ?? path.basename(f, '.json')
    for (const [appId, rec] of Object.entries(data.apps)) {
      if (Array.isArray(rec.history)) {
        for (const h of rec.history) map[label + '-' + appId + '-r' + h.round] = h
      } else {
        map[label + '-' + appId] = {
          verdict: rec.after ? 'measured' : 'failed',
          delta: rec.after ? rec.after.score - rec.before.score : null,
          summary: rec.error ?? null,
        }
      }
    }
  }
  return map
}

const verdicts = loadVerdicts()
fs.mkdirSync(DEST, { recursive: true })
const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.jsonl') && (!only || f.startsWith(only)))
let count = 0

for (const file of files) {
  const events = parse(path.join(SRC, file))
  const name = path.basename(file, '.jsonl')
  const init = events.find((e) => e.type === 'system')
  const result = events.find((e) => e.type === 'result')
  const md = []

  md.push('# Trajectory: `' + name + '`\n')
  md.push('| | |')
  md.push('|---|---|')
  md.push('| Model | `' + (init?.model ?? 'unknown') + '` |')
  md.push('| Permission mode | `' + (init?.permissionMode ?? '-') + '` |')
  md.push('| Tools available | ' + ((init?.tools ?? []).join(', ') || '_none — this arm had no tools_') + ' |')
  md.push('| Turns | ' + (result?.num_turns ?? '-') + ' |')
  md.push('| Duration | ' + (result?.duration_ms ? Math.round(result.duration_ms / 1000) + ' s' : '-') + ' |')
  md.push('')

  let step = 0
  for (const e of events) {
    if (e.type === 'user' && typeof e.message?.content === 'string') {
      md.push('## Instruction\n')
      md.push('```\n' + clip(e.message.content, 3000) + '\n```\n')
    }
    for (const c of e.message?.content ?? []) {
      if (e.type === 'assistant' && c.type === 'text' && c.text?.trim()) {
        md.push('**Claude:** ' + clip(c.text.trim(), 1200) + '\n')
      }
      if (e.type === 'assistant' && c.type === 'tool_use') {
        step++
        const input = JSON.stringify(c.input ?? {})
        md.push('**' + step + '. → ' + c.name + '** `' + clip(input, 300) + '`\n')
      }
      if (e.type === 'user' && c.type === 'tool_result') {
        const body = typeof c.content === 'string'
          ? c.content
          : (c.content ?? []).map((x) => x.text ?? '').join('\n')
        md.push('<details><summary>tool response' + (c.is_error ? ' (error)' : '') +
          '</summary>\n\n```\n' + clip(body, 900) + '\n```\n\n</details>\n')
      }
    }
  }

  if (result?.result) {
    md.push('## Final reply\n')
    md.push('```\n' + clip(result.result, 1500) + '\n```\n')
  }

  const v = verdicts[name]
  if (v) {
    md.push('## Harness verdict — the feedback that shaped the next round\n')
    md.push('This is produced by the harness, not by the model. The model is never')
    md.push('asked to report its own score.\n')
    md.push('| | |')
    md.push('|---|---|')
    md.push('| Outcome | **' + (v.verdict ?? '-') + '** |')
    if (v.delta != null) md.push('| Lighthouse delta | ' + (v.delta >= 0 ? '+' : '') + v.delta + ' |')
    if (v.diffs?.length) md.push('| Behavioural diffs | ' + v.diffs.join('; ') + ' |')
    if (v.summary) md.push('| Summary carried into next round | ' + v.summary + ' |')
    md.push('')
  }

  fs.writeFileSync(path.join(DEST, name + '.md'), md.join('\n'))
  count++
}

console.log('rendered ' + count + ' trajectories -> results/trajectories-md/')
