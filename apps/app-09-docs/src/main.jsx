import React from 'react'
import { createRoot } from 'react-dom/client'
import { SECTIONS } from './sections.js'

function Para({ text }) {
  // Each word becomes its own element so the search highlighter can target it.
  return (
    <p style={{ margin: '0 0 8px' }}>
      {text.split(' ').map((w, i) => <span key={i}><span>{w}</span>{' '}</span>)}
    </p>
  )
}

function Section({ s }) {
  return (
    <section>
      <div><div><div>
        <h2>{s.heading}</h2>
        {s.paras.map((p, i) => <Para key={i} text={p} />)}
      </div></div></div>
    </section>
  )
}

function App() {
  return (
    <main style={{ font: '14px system-ui', maxWidth: 760, margin: '0 auto', padding: 16 }}>
      <h1>Operating Manual</h1>
      {SECTIONS.map((s) => <Section key={s.id} s={s} />)}
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
