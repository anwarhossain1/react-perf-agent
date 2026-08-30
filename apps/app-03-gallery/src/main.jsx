import React from 'react'
import { createRoot } from 'react-dom/client'
import { PHOTOS } from './photos.js'

function Photo({ photo }) {
  return (
    <figure style={{ margin: 0 }}>
      <img src={photo.src} alt={photo.title} style={{ width: '100%' }} />
      <figcaption style={{ padding: '4px 0', color: '#666' }}>{photo.title}</figcaption>
    </figure>
  )
}

function App() {
  return (
    <main style={{ font: '14px system-ui', padding: 16 }}>
      <h1>Site Survey Gallery</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {PHOTOS.map((p) => <Photo key={p.id} photo={p} />)}
      </div>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
