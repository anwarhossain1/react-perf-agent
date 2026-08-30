import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CATALOG } from './catalog.js'

function Row({ item, query }) {
  const highlight = item.name.toLowerCase().includes(query.toLowerCase())
  return (
    <li style={{ padding: 8, borderBottom: '1px solid #eee', background: highlight ? '#fffbe6' : '#fff' }}>
      <strong>{item.name}</strong> <span style={{ color: '#888' }}>{item.sku}</span>
      <em style={{ float: 'right' }}>${item.price}</em>
      <p style={{ margin: '4px 0 0', color: '#666' }}>{item.desc}</p>
      <small>{item.tags.join(' · ')}</small>
    </li>
  )
}

function App() {
  const [query, setQuery] = useState('')
  const rows = CATALOG.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
  return (
    <main style={{ font: '14px system-ui', maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <h1>Parts Catalog</h1>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter parts…"
        style={{ width: '100%', padding: 8, fontSize: 16, marginBottom: 12 }} />
      <p>{rows.length} of {CATALOG.length} parts</p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {rows.map((item) => <Row key={item.id} item={item} query={query} />)}
      </ul>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
