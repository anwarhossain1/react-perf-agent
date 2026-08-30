import React from 'react'
import { createRoot } from 'react-dom/client'
import { LEDGER_JSON } from './ledger.js'

const LEDGER = JSON.parse(LEDGER_JSON)

function totalsByRegion(rows) {
  const out = {}
  for (const r of rows) out[r.region] = (out[r.region] || 0) + r.amount
  return out
}

function App() {
  const totals = totalsByRegion(LEDGER)
  return (
    <main style={{ font: '13px system-ui', padding: 16 }}>
      <h1>Quarterly Ledger</h1>
      <table style={{ borderCollapse: 'collapse', marginBottom: 20 }}>
        <tbody>
          {Object.entries(totals).map(([region, amt]) => (
            <tr key={region}><td style={{ padding: 4 }}>{region}</td><td style={{ padding: 4 }}>{amt}</td></tr>
          ))}
        </tbody>
      </table>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead><tr><th>Account</th><th>Region</th><th>Amount</th><th>Memo</th></tr></thead>
        <tbody>
          {LEDGER.map((r) => (
            <tr key={r.id}>
              <td style={{ padding: 3, borderBottom: '1px solid #f0f0f0' }}>{r.account}</td>
              <td style={{ padding: 3, borderBottom: '1px solid #f0f0f0' }}>{r.region}</td>
              <td style={{ padding: 3, borderBottom: '1px solid #f0f0f0' }}>{r.amount}</td>
              <td style={{ padding: 3, borderBottom: '1px solid #f0f0f0' }}>{r.memo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
