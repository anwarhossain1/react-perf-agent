import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import * as utils from './utils.js'

const TABS = ['Users', 'Roles', 'Audit', 'Billing', 'Settings']

function UsersTab() {
  const rows = Array.from({ length: 400 }, (_, i) => ({ id: i, name: utils.helper0('user' + i) }))
  return <ul>{rows.map((r) => <li key={r.id}>{r.name}</li>)}</ul>
}
function RolesTab() {
  const rows = Array.from({ length: 400 }, (_, i) => ({ id: i, name: utils.helper1('role' + i) }))
  return <ul>{rows.map((r) => <li key={r.id}>{r.name}</li>)}</ul>
}
function AuditTab() {
  const rows = Array.from({ length: 400 }, (_, i) => ({ id: i, name: utils.helper2('event' + i) }))
  return <ul>{rows.map((r) => <li key={r.id}>{r.name}</li>)}</ul>
}
function BillingTab() {
  const rows = Array.from({ length: 400 }, (_, i) => ({ id: i, name: utils.helper3('invoice' + i) }))
  return <ul>{rows.map((r) => <li key={r.id}>{r.name}</li>)}</ul>
}
function SettingsTab() {
  const rows = Array.from({ length: 400 }, (_, i) => ({ id: i, name: utils.helper4('flag' + i) }))
  return <ul>{rows.map((r) => <li key={r.id}>{r.name}</li>)}</ul>
}

const PANES = { Users: UsersTab, Roles: RolesTab, Audit: AuditTab, Billing: BillingTab, Settings: SettingsTab }

function App() {
  const [tab, setTab] = useState('Users')
  const Pane = PANES[tab]
  return (
    <main style={{ font: '14px system-ui', padding: 16 }}>
      <h1>Admin Console</h1>
      <nav style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '6px 12px', fontWeight: t === tab ? 700 : 400 }}>{t}</button>
        ))}
      </nav>
      <Pane />
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
