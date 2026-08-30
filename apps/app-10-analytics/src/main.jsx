import React from 'react'
import { createRoot } from 'react-dom/client'
import { EVENTS } from './events.js'

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor((sorted.length - 1) * p)]
}

// Recomputed from scratch for every tile below.
function statsFor(type) {
  const ms = EVENTS.filter((e) => e.type === type).map((e) => e.ms)
  return { type, n: ms.length, p50: percentile(ms, 0.5), p95: percentile(ms, 0.95), p99: percentile(ms, 0.99) }
}

const TYPES = Array.from({ length: 18 }, (_, i) => 't' + i)

function Tile({ type }) {
  const s = statsFor(type)
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12 }}>
      <h3 style={{ margin: 0 }}>{s.type}</h3>
      <p style={{ margin: '4px 0 0' }}>n={s.n} p50={s.p50}</p>
      <p style={{ margin: 0, color: '#888' }}>p95={s.p95} p99={s.p99}</p>
    </div>
  )
}

function App() {
  return (
    <main style={{ font: '14px system-ui', padding: 16 }}>
      <h1>Event Analytics</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
        {TYPES.map((t) => <Tile key={t} type={t} />)}
      </div>
      <h2>Recent events</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {EVENTS.map((e) => (
          <li key={e.id} style={{ padding: 3, borderBottom: '1px solid #f2f2f2' }}>
            {e.type} · {e.user} · {e.ms} — {e.payload}
          </li>
        ))}
      </ul>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
