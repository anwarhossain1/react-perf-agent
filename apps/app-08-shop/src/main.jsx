import React from 'react'
import { createRoot } from 'react-dom/client'
import { PRODUCTS } from './products.js'

// A fresh formatter per call — allocation-heavy when run across the whole catalog.
function formatPrice(cents, currency) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

function Card({ p }) {
  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 6, padding: 10 }}>
      <h3 style={{ margin: 0, fontSize: 15 }}>{p.title}</h3>
      <strong>{formatPrice(p.cents, p.currency)}</strong>
      <p style={{ margin: '6px 0 0', color: '#666', fontSize: 12 }}>{p.blurb}</p>
    </div>
  )
}

function App() {
  const sorted = [...PRODUCTS].sort((a, b) =>
    formatPrice(a.cents, a.currency).localeCompare(formatPrice(b.cents, b.currency)))
  return (
    <main style={{ font: '14px system-ui', padding: 16 }}>
      <h1>Spare Parts Store</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {sorted.map((p) => <Card key={p.id} p={p} />)}
      </div>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
