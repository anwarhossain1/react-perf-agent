import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { FEED } from './feed.js'

function Card({ post }) {
  return (
    <article style={{ border: '1px solid #e5e5e5', borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}>
      <img src={post.media} alt="" style={{ width: '100%', display: 'block' }} />
      <div style={{ padding: 12 }}>
        <strong>@{post.author}</strong>
        <p style={{ margin: '6px 0 0', color: '#555' }}>{post.text}</p>
      </div>
    </article>
  )
}

function App() {
  const [banner, setBanner] = useState(null)
  useEffect(() => {
    const t = setTimeout(() => setBanner('Scheduled maintenance this Sunday 02:00–04:00 UTC'), 900)
    return () => clearTimeout(t)
  }, [])
  return (
    <main style={{ font: '14px system-ui', maxWidth: 640, margin: '0 auto', padding: 16 }}>
      {banner && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffe69c', padding: 16, marginBottom: 12 }}>
          {banner}
        </div>
      )}
      <h1>Operations Feed</h1>
      {FEED.map((p) => <Card key={p.id} post={p} />)}
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
