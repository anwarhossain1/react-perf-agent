/** Cheap directory snapshot/restore, so a bad round can be undone. */
import fs from 'node:fs'
import path from 'node:path'

const SKIP = new Set(['dist', 'node_modules'])

export function snapshot (dir) {
  const files = {}
  const walk = (d, rel = '') => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (SKIP.has(e.name)) continue
      const full = path.join(d, e.name), r = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) walk(full, r)
      else files[r] = fs.readFileSync(full)
    }
  }
  walk(dir)
  return files
}

export function restore (dir, files) {
  // Remove anything the round added, then write the snapshot back.
  const present = new Set(Object.keys(files))
  const walk = (d, rel = '') => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (SKIP.has(e.name)) continue
      const full = path.join(d, e.name), r = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) walk(full, r)
      else if (!present.has(r)) fs.rmSync(full)
    }
  }
  walk(dir)
  for (const [rel, buf] of Object.entries(files)) {
    const full = path.join(dir, rel)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, buf)
  }
}
