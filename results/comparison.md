# Results

Eval set: 10 Vite + React apps. Lighthouse mobile preset,
simulated 4G + 4x CPU throttle, median of 3. Starting mean score **66.6**.

`app-05-admin` is a negative control - already optimal, so the correct action is to change nothing.

## Headline

| Metric | simple | baseline | agent | agent-norevert | agent-1round |
|---|---|---|---|---|---|
| **Verified gain (primary)** | **+5.8** | **+32.6** | **+35.4** | **+33.8** | **+23.2** |
| Raw gain, unverified | +5.8 | +32.6 | +35.4 | +33.8 | +23.2 |
| Apps behaviourally broken | 1/10 (10%) | 0/10 (0%) | 0/10 (0%) | 0/10 (0%) | 0/10 (0%) |
| Build failures | 8/10 | 0/10 | 0/10 | 0/10 | 0/10 |
| Control regressions (false positives) | 0/1 | 0/1 | 0/1 | 0/1 | 0/1 |
| Changes reverted by guard | - | - | 5 | - | 1 |
| Wall-clock, whole eval set | 24.9 min | 65 min | 77.2 min | 56.2 min | 16.7 min |

## simple - per app

| App | Before | After | Raw | Verified | Behaviour | JS KB |
|---|---|---|---|---|---|---|
| app-01-catalog | 45 | build failed | +0 | +0 | ok | 1893.6 → - |
| app-02-dashboard | 73 | build failed | +0 | +0 | ok | 710.9 → - |
| app-03-gallery | 52 | build failed | +0 | +0 | **BROKEN** - verification failed: build failed for app-03-gallery:
[31mfailed to load config from D:\SKH\hackathon-react-perf-agent\runs\simple\app-03-gallery\vite.config.js[39m
[31merror during build:
Error [ERR_MODULE_NOT_FOUND]: | 1176.9 → - |
| app-04-blog | 72 | build failed | +0 | +0 | ok | 329 → - |
| app-05-admin _(control)_ | 99 | 100 | +1 | +1 | ok | 144.3 → 144.2 |
| app-06-feed | 85 | build failed | +0 | +0 | ok | 283.5 → - |
| app-07-report | 49 | build failed | +0 | +0 | ok | 1245.3 → - |
| app-08-shop | 47 | 99 | +52 | +52 | ok | 658.5 → 156.8 |
| app-09-docs | 71 | build failed | +0 | +0 | ok | 519.1 → - |
| app-10-analytics | 73 | build failed | +0 | +0 | ok | 700.7 → - |

## baseline - per app

| App | Before | After | Raw | Verified | Behaviour | JS KB |
|---|---|---|---|---|---|---|
| app-01-catalog | 45 | 100 | +55 | +55 | ok | 1893.6 → 142 |
| app-02-dashboard | 73 | 100 | +27 | +27 | ok | 710.9 → 141.1 |
| app-03-gallery | 52 | 99 | +47 | +47 | ok | 1176.9 → 150.3 |
| app-04-blog | 72 | 99 | +27 | +27 | ok | 329 → 139.5 |
| app-05-admin _(control)_ | 99 | 99 | +0 | +0 | ok | 144.3 → 143.3 |
| app-06-feed | 85 | 89 | +4 | +4 | ok | 283.5 → 139.2 |
| app-07-report | 49 | 77 | +28 | +28 | ok | 1245.3 → 141.3 |
| app-08-shop | 47 | 98 | +51 | +51 | ok | 658.5 → 210.5 |
| app-09-docs | 71 | 99 | +28 | +28 | ok | 519.1 → 139.7 |
| app-10-analytics | 73 | 99 | +26 | +26 | ok | 700.7 → 140.6 |

## agent - per app

| App | Before | After | Raw | Verified | Behaviour | JS KB |
|---|---|---|---|---|---|---|
| app-01-catalog | 45 | 99 | +54 | +54 | ok | 1893.6 → 181.4 |
| app-02-dashboard | 73 | 98 | +25 | +25 | ok | 710.9 → 195.4 |
| app-03-gallery | 52 | 100 | +48 | +48 | ok | 1176.9 → 6.7 |
| app-04-blog | 72 | 99 | +27 | +27 | ok | 329 → 151.2 |
| app-05-admin _(control)_ | 99 | 100 | +1 | +1 | ok | 144.3 → 6 |
| app-06-feed | 85 | 99 | +14 | +14 | ok | 283.5 → 185 |
| app-07-report | 49 | 94 | +45 | +45 | ok | 1245.3 → 1.7 |
| app-08-shop | 47 | 97 | +50 | +50 | ok | 658.5 → 140.1 |
| app-09-docs | 71 | 100 | +29 | +29 | ok | 519.1 → 12.9 |
| app-10-analytics | 73 | 100 | +27 | +27 | ok | 700.7 → 2 |

## agent-norevert - per app

| App | Before | After | Raw | Verified | Behaviour | JS KB |
|---|---|---|---|---|---|---|
| app-01-catalog | 45 | 91 | +46 | +46 | ok | 1893.6 → 2.5 |
| app-02-dashboard | 73 | 100 | +27 | +27 | ok | 710.9 → 2.3 |
| app-03-gallery | 52 | 100 | +48 | +48 | ok | 1176.9 → 0 |
| app-04-blog | 72 | 100 | +28 | +28 | ok | 329 → 0 |
| app-05-admin _(control)_ | 99 | 100 | +1 | +1 | ok | 144.3 → 0 |
| app-06-feed | 85 | 100 | +15 | +15 | ok | 283.5 → 2.2 |
| app-07-report | 49 | 80 | +31 | +31 | ok | 1245.3 → 1.7 |
| app-08-shop | 47 | 100 | +53 | +53 | ok | 658.5 → 0 |
| app-09-docs | 71 | 100 | +29 | +29 | ok | 519.1 → 0 |
| app-10-analytics | 73 | 100 | +27 | +27 | ok | 700.7 → 1.7 |

## agent-1round - per app

| App | Before | After | Raw | Verified | Behaviour | JS KB |
|---|---|---|---|---|---|---|
| app-01-catalog | 45 | 45 | +0 | +0 | ok | 1893.6 → 1893.6 |
| app-02-dashboard | 73 | 99 | +26 | +26 | ok | 710.9 → 140.4 |
| app-03-gallery | 52 | 99 | +47 | +47 | ok | 1176.9 → 150.1 |
| app-04-blog | 72 | 92 | +20 | +20 | ok | 329 → 329 |
| app-05-admin _(control)_ | 99 | 100 | +1 | +1 | ok | 144.3 → 0 |
| app-06-feed | 85 | 95 | +10 | +10 | ok | 283.5 → 283.6 |
| app-07-report | 49 | 89 | +40 | +40 | ok | 1245.3 → 140.4 |
| app-08-shop | 47 | 74 | +27 | +27 | ok | 658.5 → 658.6 |
| app-09-docs | 71 | 85 | +14 | +14 | ok | 519.1 → 139.8 |
| app-10-analytics | 73 | 98 | +25 | +25 | ok | 700.7 → 140.3 |
