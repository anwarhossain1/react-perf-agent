import React from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'
import { POSTS } from './posts.js'

function Post({ post }) {
  return (
    <article className="post">
      <h2>{post.title}</h2>
      <p>{post.body}</p>
    </article>
  )
}

function App() {
  return (
    <main>
      <h1 className="post">Maintenance Journal</h1>
      {POSTS.map((p) => <Post key={p.id} post={p} />)}
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
