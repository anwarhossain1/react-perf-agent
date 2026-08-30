import React from 'react'
import { createRoot } from 'react-dom/client'
import { READINGS } from './readings.js'

// Calibration pass over the sensor grid, run once at startup.
let calibration = 0
for (let i = 0; i < 12_000_000; i++) calibration += Math.sqrt(i) % 11

function summarise(readings) {
  const bySensor = {}
  for (const r of readings) {
    if (!bySensor[r.sensor]) bySensor[r.sensor] = []
    bySensor[r.sensor].push(r.v)
  }
  return Object.entries(bySensor).map(([sensor, vs]) => ({
    sensor,
    mean: vs.reduce((a, b) => a + b, 0) / vs.length,
    peak: Math.max(...vs),
    samples: vs.length,
  }))
}

function Tile({ s }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12, minWidth: 150 }}>
      <h3 style={{ margin: 0 }}>{s.sensor}</h3>
      <p style={{ margin: '6px 0 0' }}>mean {s.mean.toFixed(1)} kPa</p>
      <p style={{ margin: 0, color: '#888' }}>peak {s.peak} · n={s.samples}</p>
    </div>
  )
}

function App() {
  const summary = summarise(READINGS)
  return (
    <main style={{ font: '14px system-ui', padding: 16 }}>
      <h1>Plant Telemetry</h1>
      <p>calibration {Math.round(calibration)}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {summary.map((s) => <Tile key={s.sensor} s={s} />)}
      </div>
      <h2>Raw log</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {READINGS.map((r) => (
          <li key={r.t} style={{ padding: 4, borderBottom: '1px solid #f0f0f0' }}>
            {r.sensor} · {r.v} {r.unit} — {r.note}
          </li>
        ))}
      </ul>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
