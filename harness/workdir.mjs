/** Copy a pristine eval app into an isolated run directory. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SKIP = new Set(['dist', 'node_modules'])

export function prepareWorkdir (appId, label) {
  const src = path.join(ROOT, 'apps', appId)
  const destBase = path.join(ROOT, 'runs', label)
  const dest = path.join(destBase, appId)
  fs.rmSync(dest, { recursive: true, force: true })
  fs.mkdirSync(dest, { recursive: true })
  const copy = (from, to) => {
    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
      if (SKIP.has(entry.name)) continue
      const f = path.join(from, entry.name), t = path.join(to, entry.name)
      if (entry.isDirectory()) { fs.mkdirSync(t, { recursive: true }); copy(f, t) }
      else fs.copyFileSync(f, t)
    }
  }
  copy(src, dest)
  return { dest, baseDir: path.join('runs', label) }
}
