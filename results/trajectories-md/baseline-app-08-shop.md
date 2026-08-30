# Trajectory: `baseline-app-08-shop`

| | |
|---|---|
| Model | `claude-opus-5` |
| Permission mode | `acceptEdits` |
| Tools available | Edit, Glob, Grep, Read, Write |
| Turns | 33 |
| Duration | 523 s |

**Claude:** I'll start by exploring the app structure.

**1. → Glob** `{"pattern":"**/*","path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop"}`

<details><summary>tool response</summary>

```
vite.config.js
index.html
src\products.js
src\main.jsx
```

</details>

**2. → Read** `{"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\vite.config.js"}`

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

**3. → Read** `{"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\index.html"}`

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

**4. → Read** `{"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\main.jsx"}`

**5. → Read** `{"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\products.js"}`

<details><summary>tool response</summary>

```
1	import React from 'react'
2	import { createRoot } from 'react-dom/client'
3	import { PRODUCTS } from './products.js'
4	
5	// A fresh formatter per call — allocation-heavy when run across the whole catalog.
6	function formatPrice(cents, currency) {
7	  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
8	}
9	
10	function Card({ p }) {
11	  return (
12	    <div style={{ border: '1px solid #e0e0e0', borderRadius: 6, padding: 10 }}>
13	      <h3 style={{ margin: 0, fontSize: 15 }}>{p.title}</h3>
14	      <strong>{formatPrice(p.cents, p.currency)}</strong>
15	      <p style={{ margin: '6px 0 0', color: '#666', fontSize: 12 }}>{p.blurb}</p>
16	    </div>
17	  )
18	}
19	
20	function App() {
21	  const sorted = [...PRODUCTS].sort((a, b) =>
22	    formatPrice(a.cents, a.currency).localeCompare(formatPrice(b.cents, b.currency)))
23	  return (
24	    <main 
… [370 more characters]
```

</details>

<details><summary>tool response (error)</summary>

```
File content (527.5KB) exceeds maximum allowed size (256KB). Use offset and limit parameters to read specific portions of the file, or search for specific content instead of reading the whole file.
```

</details>

**6. → Read** `{"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\products.js","limit":30}`

<details><summary>tool response</summary>

```
1	export const PRODUCTS = [
2	  {id:0,title:"Item 0",cents:0,currency:"USD",blurb:"field tested replacement part with twelve month warranty field tested replacement part with twelve month warranty "},
3	  {id:1,title:"Item 1",cents:97,currency:"USD",blurb:"field tested replacement part with twelve month warranty field tested replacement part with twelve month warranty "},
4	  {id:2,title:"Item 2",cents:194,currency:"USD",blurb:"field tested replacement part with twelve month warranty field tested replacement part with twelve month warranty "},
5	  {id:3,title:"Item 3",cents:291,currency:"USD",blurb:"field tested replacement part with twelve month warranty field tested replacement part with twelve month warranty "},
6	  {id:4,title:"Item 4",cents:388,currency:"USD",blurb:"field tested replacement part with twelve month warranty field tested replacement part with twelve month warranty "},

… [4276 more characters]
```

</details>

**7. → Glob** `{"pattern":"**/package.json","path":"D:\\SKH\\hackathon-react-perf-agent"}`

<details><summary>tool response</summary>

```
D:\SKH\hackathon-react-perf-agent\node_modules\color-name\package.json
D:\SKH\hackathon-react-perf-agent\node_modules\color-convert\package.json
D:\SKH\hackathon-react-perf-agent\node_modules\emoji-regex\package.json
D:\SKH\hackathon-react-perf-agent\node_modules\esprima\package.json
D:\SKH\hackathon-react-perf-agent\node_modules\get-caller-file\package.json
D:\SKH\hackathon-react-perf-agent\node_modules\is-fullwidth-code-point\package.json
D:\SKH\hackathon-react-perf-agent\node_modules\loose-envify\package.json
D:\SKH\hackathon-react-perf-agent\node_modules\once\package.json
D:\SKH\hackathon-react-perf-agent\node_modules\require-directory\package.json
D:\SKH\hackathon-react-perf-agent\node_modules\source-map\package.json
D:\SKH\hackathon-react-perf-agent\node_modules\wrappy\package.json
D:\SKH\hackathon-react-perf-agent\node_modules\esutils\package.json
D:\SKH\hackathon-react-perf-agent
… [6539 more characters]
```

</details>

**8. → Grep** `{"pattern":"^  \\{id:","path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\products.js","output_mode":"count"}`

<details><summary>tool response</summary>

```
src\products.js:3000

Found 3000 total occurrences across 1 file.
```

</details>

**9. → Read** `{"file_path":"D:\\SKH\\hackathon-react-perf-agent\\package.json"}`

<details><summary>tool response</summary>

```
1	{
2	  "name": "react-perf-agent",
3	  "private": true,
4	  "version": "0.1.0",
5	  "type": "module",
6	  "description": "An agent that diagnoses, fixes, and verifies React performance regressions.",
7	  "scripts": {
8	    "measure": "node harness/measure.mjs",
9	    "baseline": "node baseline/run-baseline.mjs",
10	    "agent": "node agent/run-agent.mjs",
11	    "score": "node harness/score.mjs"
12	  },
13	  "dependencies": {
14	    "react": "^18.3.1",
15	    "react-dom": "^18.3.1"
16	  },
17	  "devDependencies": {
18	    "@vitejs/plugin-react": "^4.3.4",
19	    "vite": "^5.4.11",
20	    "lighthouse": "^12.2.1",
21	    "chrome-launcher": "^1.1.2",
22	    "sirv-cli": "^3.0.0",
23	    "puppeteer-core": "^23.0.0"
24	  }
25	}
26	
```

</details>

**10. → Glob** `{"pattern":"harness/**","path":"D:\\SKH\\hackathon-react-perf-agent"}`

**11. → Glob** `{"pattern":"apps/app-08-shop/**","path":"D:\\SKH\\hackathon-react-perf-agent"}`

<details><summary>tool response</summary>

```
D:\SKH\hackathon-react-perf-agent\harness\measure-all.mjs
D:\SKH\hackathon-react-perf-agent\harness\measure.mjs
D:\SKH\hackathon-react-perf-agent\harness\ground-truth.json
D:\SKH\hackathon-react-perf-agent\harness\workdir.mjs
D:\SKH\hackathon-react-perf-agent\harness\snapshot.mjs
D:\SKH\hackathon-react-perf-agent\harness\score.mjs
D:\SKH\hackathon-react-perf-agent\harness\verify.mjs
D:\SKH\hackathon-react-perf-agent\harness\verify-run.mjs
D:\SKH\hackathon-react-perf-agent\harness\render-trajectory.mjs
D:\SKH\hackathon-react-perf-agent\harness\run-claude.mjs
```

</details>

<details><summary>tool response</summary>

```
D:\SKH\hackathon-react-perf-agent\apps\app-08-shop\vite.config.js
D:\SKH\hackathon-react-perf-agent\apps\app-08-shop\index.html
D:\SKH\hackathon-react-perf-agent\apps\app-08-shop\src\products.js
D:\SKH\hackathon-react-perf-agent\apps\app-08-shop\src\main.jsx
D:\SKH\hackathon-react-perf-agent\apps\app-08-shop\dist\assets\index-CZR7-AZ6.js
D:\SKH\hackathon-react-perf-agent\apps\app-08-shop\dist\index.html
```

</details>

**12. → Read** `{"file_path":"D:\\SKH\\hackathon-react-perf-agent\\harness\\verify.mjs"}`

<details><summary>tool response</summary>

```
1	/**
2	 * verify.mjs - the correctness guard.
3	 *
4	 * A performance score means nothing if the app stopped working. This renders a
5	 * build in a real browser and captures behavioural invariants that a legitimate
6	 * optimisation must preserve.
7	 *
8	 * Two things make this harder than a DOM diff, and both are load-bearing:
9	 *
10	 *  1. Windowing a long list is a CORRECT fix that removes thousands of nodes,
11	 *     so node counts and whole-page innerText are useless - the optimised page
12	 *     legitimately contains less DOM than the original.
13	 *  2. Adding explicit width/height to images is the textbook CLS fix and it
14	 *     legitimately changes page height. v1 of this file gated on scroll height
15	 *     and flagged 4/10 correct fixes as breakage (see CHANGELOG Step 1b).
16	 *
17	 * What survives both: a CONTENT PROFILE. Scroll to 24 evenly spaced fractions of
18	 * 
… [8853 more characters]
```

</details>

**13. → Read** `{"file_path":"D:\\SKH\\hackathon-react-perf-agent\\harness\\measure.mjs"}`

<details><summary>tool response</summary>

```
1	/**
2	 * measure.mjs — the scoreboard.
3	 * Builds an app, serves the production bundle, runs Lighthouse N times under
4	 * fixed throttling, and reports the MEDIAN. Perf numbers are noisy; a single
5	 * run is not evidence.
6	 *
7	 * Usage: node harness/measure.mjs <appId> [runs]
8	 */
9	import { spawn } from 'node:child_process'
10	import http from 'node:http'
11	import fs from 'node:fs'
12	import path from 'node:path'
13	import { fileURLToPath } from 'node:url'
14	import lighthouse from 'lighthouse'
15	import * as chromeLauncher from 'chrome-launcher'
16	
17	const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
18	const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
19	  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' }
20	
21	export function buildApp (appId, baseDir = 'apps') {
22	
… [4352 more characters]
```

</details>

**14. → Grep** `{"pattern":"blurb:\"field tested replacement part with twelve month warranty field tested replacement part with twelve month warranty \"\\}","path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\products.js","output_mode":"count"}`

<details><summary>tool response</summary>

```
src\products.js:3000

Found 3000 total occurrences across 1 file.
```

</details>

**15. → Grep** `{"pattern":"currency:\"USD\"","path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\products.js","output_mode":"count"}`

<details><summary>tool response</summary>

```
src\products.js:3000

Found 3000 total occurrences across 1 file.
```

</details>

**16. → Read** `{"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\products.js","offset":2995,"limit":10}`

<details><summary>tool response</summary>

```
2995	  {id:2993,title:"Item 2993",cents:40321,currency:"USD",blurb:"field tested replacement part with twelve month warranty field tested replacement part with twelve month warranty "},
2996	  {id:2994,title:"Item 2994",cents:40418,currency:"USD",blurb:"field tested replacement part with twelve month warranty field tested replacement part with twelve month warranty "},
2997	  {id:2995,title:"Item 2995",cents:40515,currency:"USD",blurb:"field tested replacement part with twelve month warranty field tested replacement part with twelve month warranty "},
2998	  {id:2996,title:"Item 2996",cents:40612,currency:"USD",blurb:"field tested replacement part with twelve month warranty field tested replacement part with twelve month warranty "},
2999	  {id:2997,title:"Item 2997",cents:40709,currency:"USD",blurb:"field tested replacement part with twelve month warranty field tested replacement part w
… [415 more characters]
```

</details>

**17. → Grep** `{"pattern":",title:\"Item \\d+\",cents:\\d+,","path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\products.js","output_mode":"count"}`

<details><summary>tool response</summary>

```
src\products.js:3000

Found 3000 total occurrences across 1 file.
```

</details>

**18. → Grep** `{"pattern":"\\{id:","path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\products.js","output_mode":"count"}`

<details><summary>tool response</summary>

```
src\products.js:3000

Found 3000 total occurrences across 1 file.
```

</details>

**Claude:** Data rows are perfectly uniform. Now I'll compact the data file (the blurb string alone is ~340 KB of duplication).

**19. → Edit** `{"replace_all":false,"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\products.js","old_string":"export const PRODUCTS = [\n  {id:0,","new_string":"// Every row shares the same currency and blurb, so they are stored once instead\n// of 3000 times, and the rows them
… [343 more characters]`

<details><summary>tool response</summary>

```
The file D:\SKH\hackathon-react-perf-agent\runs\baseline\app-08-shop\src\products.js has been updated successfully. (file state is current in your context — no need to Read it back)
```

</details>

**20. → Edit** `{"replace_all":true,"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\products.js","old_string":",currency:\"USD\",blurb:\"field tested replacement part with twelve month warranty field tested replacement part with twelve month warranty \"}","new_string":"]"}`

<details><summary>tool response</summary>

```
The file D:\SKH\hackathon-react-perf-agent\runs\baseline\app-08-shop\src\products.js has been updated. All occurrences were successfully replaced. (file state is current in your context — no need to Read it back)
```

</details>

**21. → Edit** `{"replace_all":true,"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\products.js","old_string":",title:\"","new_string":",\""}`

<details><summary>tool response</summary>

```
The file D:\SKH\hackathon-react-perf-agent\runs\baseline\app-08-shop\src\products.js has been updated. All occurrences were successfully replaced. (file state is current in your context — no need to Read it back)
```

</details>

**22. → Edit** `{"replace_all":true,"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\products.js","old_string":",cents:","new_string":","}`

<details><summary>tool response</summary>

```
The file D:\SKH\hackathon-react-perf-agent\runs\baseline\app-08-shop\src\products.js has been updated. All occurrences were successfully replaced. (file state is current in your context — no need to Read it back)
```

</details>

**23. → Edit** `{"replace_all":true,"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\products.js","old_string":"  {id:","new_string":"  ["}`

<details><summary>tool response</summary>

```
The file D:\SKH\hackathon-react-perf-agent\runs\baseline\app-08-shop\src\products.js has been updated. All occurrences were successfully replaced. (file state is current in your context — no need to Read it back)
```

</details>

**24. → Read** `{"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\products.js","limit":14}`

<details><summary>tool response</summary>

```
1	// Every row shares the same currency and blurb, so they are stored once instead
2	// of 3000 times, and the rows themselves are tuples rather than keyed objects.
3	// This is the same catalog, just without ~400KB of repeated literals in the bundle.
4	const CURRENCY = "USD"
5	const BLURB = "field tested replacement part with twelve month warranty field tested replacement part with twelve month warranty "
6	
7	// [id, title, cents]
8	const ROWS = [
9	  [0,"Item 0",0],
10	  [1,"Item 1",97],
11	  [2,"Item 2",194],
12	  [3,"Item 3",291],
13	  [4,"Item 4",388],
14	  [5,"Item 5",485],
```

</details>

**25. → Read** `{"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\products.js","offset":3003,"limit":8}`

<details><summary>tool response</summary>

```
3003	  [2994,"Item 2994",40418],
3004	  [2995,"Item 2995",40515],
3005	  [2996,"Item 2996",40612],
3006	  [2997,"Item 2997",40709],
3007	  [2998,"Item 2998",40806],
3008	  [2999,"Item 2999",40903],
3009	];
3010	
```

</details>

**Claude:** Now append the export that rebuilds the product objects:

**26. → Edit** `{"replace_all":false,"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\products.js","old_string":"  [2999,\"Item 2999\",40903],\n];\n","new_string":"  [2999,\"Item 2999\",40903],\n];\n\nexport const PRODUCTS = ROWS.map((r) => ({\n  id: r[0], title: r[1], cents: r[2]
… [44 more characters]`

<details><summary>tool response</summary>

```
The file D:\SKH\hackathon-react-perf-agent\runs\baseline\app-08-shop\src\products.js has been updated successfully. (file state is current in your context — no need to Read it back)
```

</details>

**27. → Write** `{"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\index.html","content":"<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>App</title>\n    <style>\
… [982 more characters]`

<details><summary>tool response</summary>

```
The file D:\SKH\hackathon-react-perf-agent\runs\baseline\app-08-shop\index.html has been updated successfully. (file state is current in your context — no need to Read it back)
```

</details>

**28. → Write** `{"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\main.jsx","content":"import React, { memo, useEffect, useState } from 'react'\nimport { createRoot } from 'react-dom/client'\nimport { PRODUCTS } from './products.js'\n\n// One formatter per currency, built once and
… [2002 more characters]`

<details><summary>tool response</summary>

```
The file D:\SKH\hackathon-react-perf-agent\runs\baseline\app-08-shop\src\main.jsx has been updated successfully. (file state is current in your context — no need to Read it back)
```

</details>

**29. → Edit** `{"replace_all":false,"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\main.jsx","old_string":"import React, { memo, useEffect, useState } from 'react'","new_string":"import { memo, useEffect, useState } from 'react'"}`

<details><summary>tool response</summary>

```
The file D:\SKH\hackathon-react-perf-agent\runs\baseline\app-08-shop\src\main.jsx has been updated successfully. (file state is current in your context — no need to Read it back)
```

</details>

**30. → Grep** `{"pattern":"id:|title:|cents:|blurb:\"","path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\products.js","output_mode":"content","-n":true}`

<details><summary>tool response</summary>

```
3012:  id: r[0], title: r[1], cents: r[2], currency: CURRENCY, blurb: BLURB,
```

</details>

**31. → Read** `{"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\main.jsx"}`

<details><summary>tool response</summary>

```
1	import { memo, useEffect, useState } from 'react'
2	import { createRoot } from 'react-dom/client'
3	import { PRODUCTS } from './products.js'
4	
5	// One formatter per currency, built once and reused across the whole catalog.
6	const formatters = new Map()
7	function formatPrice(cents, currency) {
8	  let f = formatters.get(currency)
9	  if (!f) {
10	    f = new Intl.NumberFormat('en-US', { style: 'currency', currency })
11	    formatters.set(currency, f)
12	  }
13	  return f.format(cents / 100)
14	}
15	
16	// The price string is both the sort key and the label, so format each product
17	// once up front rather than twice per comparison. `collator.compare` is by
18	// definition what `String.prototype.localeCompare` does with no arguments, so
19	// the resulting order is unchanged.
20	const collator = new Intl.Collator()
21	const SORTED = PRODUCTS
22	  .map((p) => ({ id: p.id, title: p.
… [1397 more characters]
```

</details>

**32. → Read** `{"file_path":"D:\\SKH\\hackathon-react-perf-agent\\runs\\baseline\\app-08-shop\\src\\products.js","offset":3006,"limit":10}`

<details><summary>tool response</summary>

```
3006	  [2997,"Item 2997",40709],
3007	  [2998,"Item 2998",40806],
3008	  [2999,"Item 2999",40903],
3009	];
3010	
3011	export const PRODUCTS = ROWS.map((r) => ({
3012	  id: r[0], title: r[1], cents: r[2], currency: CURRENCY, blurb: BLURB,
3013	}))
3014	
```

</details>

**Claude:** Done. Four changes, in order of impact:

**1. `src/products.js` — 527 KB → ~84 KB**

Every one of the 3000 rows carried an identical 114-character `blurb` and `currency:"USD"` (verified by grep: 3000/3000 for both). Those are now module-level constants, and the rows are tuples instead of keyed objects:

```js
const ROWS = [ [0,"Item 0",0], [1,"Item 1",97], ... ]
export const PRODUCTS = ROWS.map((r) => ({ id: r[0], title: r[1], cents: r[2], currency: CURRENCY, blurb: BLURB }))
```

Every id, title and cents value is preserved verbatim — no formula, no derived values. `PRODUCTS` has the same shape as before.

**2. `index.html` — static shell + CSS classes**

`<main>` and the grid `<div>` are now static markup with `#root` *being* the grid, so the DOM tree is unchanged but the heading paints before the JS arrives. The inline style objects moved into a `<style>` block (identical computed styles), which removes 9000 style-object allocations and React's per-card style serialization.

Cards get `content-visibility: auto; contain-intrinsic-size: auto 90px` — all 3000 stay in the DOM (so text content and ordering are untouched), but off-screen ones skip layout and paint.

**3. `src/main.jsx
… [1767 more characters]

## Final reply

```
Done. Four changes, in order of impact:

**1. `src/products.js` — 527 KB → ~84 KB**

Every one of the 3000 rows carried an identical 114-character `blurb` and `currency:"USD"` (verified by grep: 3000/3000 for both). Those are now module-level constants, and the rows are tuples instead of keyed objects:

```js
const ROWS = [ [0,"Item 0",0], [1,"Item 1",97], ... ]
export const PRODUCTS = ROWS.map((r) => ({ id: r[0], title: r[1], cents: r[2], currency: CURRENCY, blurb: BLURB }))
```

Every id, title and cents value is preserved verbatim — no formula, no derived values. `PRODUCTS` has the same shape as before.

**2. `index.html` — static shell + CSS classes**

`<main>` and the grid `<div>` are now static markup with `#root` *being* the grid, so the DOM tree is unchanged but the heading paints before the JS arrives. The inline style objects moved into a `<style>` block (identical computed styles), which removes 9000 style-object allocations and React's per-card style serialization.

Cards get `content-visibility: auto; contain-intrinsic-size: auto 90px` — all 3000 stay in the DOM (so text content and ordering are untouched), but off-screen ones skip layout and paint.

**3. `src/main.jsx` — the formatting hot path**

`formatPrice` built a fresh `Intl.NumberFormat` on every call, and the comparator called it twice per comparison: ~35,000 formatter constructions. Now there's one cached formatter per currency, each price is formatted exactly once, and the sort runs on the precomputed 
… [1467 more characters]
```

## Harness verdict — the feedback that shaped the next round

This is produced by the harness, not by the model. The model is never
asked to report its own score.

| | |
|---|---|
| Outcome | **measured** |
| Lighthouse delta | +51 |
