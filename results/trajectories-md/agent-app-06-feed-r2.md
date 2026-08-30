# Trajectory: `agent-app-06-feed-r2`

| | |
|---|---|
| Model | `claude-opus-5` |
| Permission mode | `acceptEdits` |
| Tools available | Edit, Glob, Grep, Read, Write |
| Turns | 10 |
| Duration | 89 s |

**Claude:** I'll start by reading the app source.

**1. → Glob** `{"pattern":"**/*.{ts,tsx,js,jsx,html,json,css}","path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\agent\\app-06-feed"}`

<details><summary>tool response</summary>

```
vite.config.js
index.html
src\main.jsx
src\feed.js
dist\index.html
dist\assets\index-B5Xp_Guf.js
```

</details>

**2. → Read** `{"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\agent\\app-06-feed\\src\\main.jsx"}`

<details><summary>tool response</summary>

```
1	import React, { useEffect, useState } from 'react'
2	import { createRoot } from 'react-dom/client'
3	import { FEED } from './feed.js'
4	
5	function Card({ post }) {
6	  return (
7	    <article style={{ border: '1px solid #e5e5e5', borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}>
8	      <img src={post.media} alt="" style={{ width: '100%', display: 'block' }} />
9	      <div style={{ padding: 12 }}>
10	        <strong>@{post.author}</strong>
11	        <p style={{ margin: '6px 0 0', color: '#555' }}>{post.text}</p>
12	      </div>
13	    </article>
14	  )
15	}
16	
17	function App() {
18	  const [banner, setBanner] = useState(null)
19	  useEffect(() => {
20	    const t = setTimeout(() => setBanner('Scheduled maintenance this Sunday 02:00–04:00 UTC'), 900)
21	    return () => clearTimeout(t)
22	  }, [])
23	  return (
24	    <main style={{ font: '14px system-ui', maxWidth: 640, ma
… [405 more characters]
```

</details>

**3. → Read** `{"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\agent\\app-06-feed\\index.html"}`

<details><summary>tool response</summary>

```
1	<!doctype html>
2	<html lang="en">
3	  <head>
4	    <meta charset="UTF-8" />
5	    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
6	    <title>App</title>
7	  </head>
8	  <body>
9	    <div id="root"></div>
10	    <script type="module" src="/src/main.jsx"></script>
11	  </body>
12	</html>
13	
```

</details>

**4. → Read** `{"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\agent\\app-06-feed\\vite.config.js"}`

<details><summary>tool response</summary>

```
1	import { defineConfig } from 'vite'
2	import react from '@vitejs/plugin-react'
3	import path from 'path'
4	import { fileURLToPath } from 'url'
5	const here = path.dirname(fileURLToPath(import.meta.url))
6	export default defineConfig({
7	  root: here,
8	  plugins: [react()],
9	  build: { outDir: path.join(here, 'dist'), emptyOutDir: true, sourcemap: false },
10	})
11	
```

</details>

**5. → Read** `{"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\agent\\app-06-feed\\src\\feed.js","limit":40}`

<details><summary>tool response</summary>

```
1	// Every record carries the same body copy and the same leading 106 bytes of SVG
2	// (everything up to the `hsl(` hue), so both are hoisted here instead of being
3	// repeated 300x in the payload. The per-record tails below are unchanged.
4	const POST_TEXT = "shift handover completed and the line is running nominal shift handover completed and the line is running nominal shift handover completed and the line is running nominal "
5	const MEDIA_PREFIX = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NDAiIGhlaWdodD0iMzYwIj48cmVjdCB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgZmlsbD0iaHNsKD"
6	
7	export const FEED = [
8	  {id:0,author:"user0",text:POST_TEXT,media:MEDIA_PREFIX+"AsNTUlLDUwJSkiLz48dGV4dCB4PSIyMCIgeT0iNjAiIGZvbnQtc2l6ZT0iMzIiIGZpbGw9IiNmZmYiPlBvc3QgMDwvdGV4dD48L3N2Zz4="},
9	  {id:1,author:"user1",text:POST_TEXT,media:MEDIA_PREFIX+"ExLDU1JSw1MCU
… [5532 more characters]
```

</details>

**Claude:** Now I have the picture. 300 cards, each with an `<img>` whose `src` is a ~250-byte base64 SVG data URI, rendered eagerly with **no intrinsic dimensions**.

That means Blink must, at load time, base64-decode and parse 300 separate SVG documents, and because the `<img>` has only `width:100%` with auto height, every one of those loads invalidates layout to discover the aspect ratio — 300 relayouts of a 1800-node tree. That is the bulk of the 433 ms TBT, and it is also the source of the residual CLS as cards resize.

**6. → Edit** `{"replace_all":false,"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\agent\\app-06-feed\\src\\main.jsx","old_string":"function Card({ post }) {\n  return (\n    <article style={{ border: '1px solid #e5e5e5', borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}>\n      <img src={post.medi
… [1242 more characters]`

<details><summary>tool response</summary>

```
The file D:\SKH\hackathon-react-perf-agent\runs\agent\app-06-feed\src\main.jsx has been updated successfully. (file state is current in your context — no need to Read it back)
```

</details>

**7. → Edit** `{"replace_all":false,"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\agent\\app-06-feed\\src\\main.jsx","old_string":"      {FEED.map((p) => <Card key={p.id} post={p} />)}","new_string":"      {FEED.map((p, i) => <Card key={p.id} post={p} eager={i < 2} />)}"}`

<details><summary>tool response</summary>

```
The file D:\SKH\hackathon-react-perf-agent\runs\agent\app-06-feed\src\main.jsx has been updated successfully. (file state is current in your context — no need to Read it back)
```

</details>

**8. → Write** `{"file_path":"C:\\Users\\irish\\.claude\\projects\\D--SKH-hackathon-react-perf-agent\\memory\\undimensioned-data-uri-images.md","content":"---\nname: undimensioned-data-uri-images\ndescription: In app-06-feed the TBT driver was 300 eager data-URI SVG <img> with no width/height, not bundle size.\nmet
… [843 more characters]`

<details><summary>tool response</summary>

```
File created successfully at: C:\Users\irish\.claude\projects\D--SKH-hackathon-react-perf-agent\memory\undimensioned-data-uri-images.md
```

</details>

**9. → Edit** `{"replace_all":false,"file_path":"C:\\Users\\irish\\.claude\\projects\\D--SKH-hackathon-react-perf-agent\\memory\\MEMORY.md","old_string":"- [Drop the React runtime after prerendering](drop-react-runtime-after-prerender.md)","new_string":"- [Undimensioned data-URI images drove TBT in app-06-feed](un
… [183 more characters]`

<details><summary>tool response</summary>

```
The file C:\Users\irish\.claude\projects\D--SKH-hackathon-react-perf-agent\memory\MEMORY.md has been updated successfully. (file state is current in your context — no need to Read it back)
```

</details>

**Claude:** Gave the 300 feed images their intrinsic `640x360` dimensions (with `height: auto`, so rendered size and scroll distance are unchanged) plus `loading="lazy"`/`decoding="async"` on all but the first two cards — expecting the large move in **Total Blocking Time**, with secondary gains in CLS and LCP.

## Final reply

```
Gave the 300 feed images their intrinsic `640x360` dimensions (with `height: auto`, so rendered size and scroll distance are unchanged) plus `loading="lazy"`/`decoding="async"` on all but the first two cards — expecting the large move in **Total Blocking Time**, with secondary gains in CLS and LCP.
```

## Harness verdict — the feedback that shaped the next round

This is produced by the harness, not by the model. The model is never
asked to report its own score.

| | |
|---|---|
| Outcome | **kept** |
| Lighthouse delta | +11 |
| Summary carried into next round | round 2: Gave the 300 feed images their intrinsic `640x360` dimensions (with `height: auto`, so ren -> kept (+11) |
