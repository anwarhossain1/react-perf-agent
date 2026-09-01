# A React performance agent that is allowed to be wrong

An agent that diagnoses, fixes, and **verifies** performance problems in React
applications — and reverts its own work when the verification fails.

---

## Who has this problem

Frontend developers who own an application that has become slow, and cannot say
why. The symptom is specific and common: Lighthouse reports a bad score, the
report names a metric (`Total Blocking Time`, `Largest Contentful Paint`), and
the metric does not name a file. The gap between "TBT is 2839 ms" and "the price
formatter is being allocated once per row inside a sort comparator" is the work,
and it is the part tooling does not do.

This is not a hypothetical user. It is the situation on every product with a
performance budget and a release date.

## What bottleneck makes it worth solving

Lighthouse, the bundle analyzer, and the React Profiler are all **diagnostic**.
They measure and they rank, but none of them changes a line of code. A developer
still has to read the source, form a hypothesis, apply a fix, rebuild, re-measure,
and decide whether the change was worth keeping — a loop of several minutes per
attempt, repeated until the score is acceptable or patience runs out.

The loop is also where the danger lives. Performance work is unusually easy to
get *wrong in a way that looks right*: drop a `useEffect` dependency and the app
is faster and subtly broken; window a list and the page no longer scrolls to the
end; shrink a dataset and the score improves while the product regresses. The
metric goes up either way. **A performance number is only meaningful next to a
correctness check**, and in practice almost nobody runs one.

So the valuable thing to automate is not the optimization. A capable coding model
already optimizes well. It is the *loop around* the optimization — measure,
change, re-measure, check behaviour, keep or revert.

## What this is

```
                 ┌────────── harness owns this loop, not the model ──────────┐
                 │                                                            │
  pristine app ──┤  measure ──> diagnose+patch ──> rebuild ──> re-measure ──> verify ──> keep
                 │     ▲            (model)          gate 1       gate 2       gate 3     │
                 │     │                                │            │            │       │
                 │     └────────────────────────────────┴────────────┴────────────┘       │
                 │                        revert the whole round                          │
                 └────────────────────────────────────────────────────────────────────────┘
```

Three properties, each a deliberate design choice:

**The loop is code, not conversation.** The harness decides what "better" means
and when to stop. The model proposes one change per round and is told the
measured outcome on the next round.

**The model cannot measure itself.** Lighthouse is run by the harness and the
numbers are handed to the model. It is never given a build tool or asked to
report its own score, so "I made this faster" is never accepted as evidence.

**Every round is atomic.** A round that fails to build, loses points, or changes
what the user sees is reverted whole. The app therefore cannot end worse than it
started — a guarantee a single-pass agent structurally cannot offer.

## The primary metric: verified gain

> A Lighthouse point counts only if the app still behaves the same afterwards.

Behaviour is captured in a real headless browser, before and after, and compared
on the things a windowing or memoization fix must preserve:

| Hard gate | Why this one |
|---|---|
| Text above the fold | catches deleted or altered content; on apps showing a record count ("6000 of 6000 parts") this is also the data-loss gate |
| Text at the bottom **after scrolling** | catches windowing that loses the tail |
| Filter interaction result | catches broken memoization and stale closures |
| Clicking a control | catches interactivity lost to pre-rendering |
| Console error-free | catches crashes the score cannot see |

Deliberately **not** a DOM node count, page height, or content position. Every one
of those is *also* changed by the correct fix — windowing removes thousands of
nodes, sizing images changes page height, pre-rendering removes React entirely.
Three verifier designs were discarded to exactly this before the gate was narrowed
to invariants that cannot drift. Page height and a positional content profile are
still recorded, but as **notes for human review, not pass/fail**.

That narrowing is a real loss of coverage, and it is stated rather than hidden: see
CHANGELOG Step 1b for the three designs and why each failed.

Secondary metrics: JS bundle KB, build success, wall-clock per app, and **false
positives on a negative control**. Note the recorded JS KB column under-reports on
builds that inline their JavaScript - see the post-hoc entry in the changelog.

## The eval set

Ten Vite + React applications, each seeded with anti-patterns taken from the
public [web.dev performance audit](https://web.dev/articles/lighthouse-performance)
vocabulary and the [React docs](https://react.dev/reference/react/useMemo) — not
invented for this project, so the agent is not being graded against problems only
it knows about. Starting scores span 45 to 99, mean **66.6**.

`app-05-admin` is a **negative control**: its planted anti-patterns were
tree-shaken away by Rollup, so it already scores 99 and the correct action is to
change nothing. It measures false positives. See the changelog for how it got
that way — it was an accident that turned out to be the most useful case in the
set.

Ground truth lives in `harness/ground-truth.json` and is **never** shown to any
arm under test.

## What existed before, and what I built

| Pre-existing | Role here |
|---|---|
| Lighthouse | measurement instrument — the scoreboard, unmodified |
| Vite / Rollup | builds the apps under test |
| Claude Code CLI | the model harness the agent drives, in headless `-p` mode |
| puppeteer-core, chrome-launcher | drive headless Chrome for verification |

Everything in `harness/`, `agent/`, `baseline/`, and `apps/` is written for this
project: the measurement pipeline, the behavioural verifier, the snapshot/revert
mechanism, the agent loop, the baseline arm, the scoring, and the eval set.

## Quick start

See [docs/REPRODUCE.md](docs/REPRODUCE.md) for a clean-machine walkthrough.

```bash
npm install
node harness/measure-all.mjs before 3     # measure the eval set
node baseline/run-baseline.mjs            # baseline arm
node agent/run-agent.mjs                  # agent arm
node harness/verify-run.mjs baseline      # behavioural check, applied to both arms
node harness/verify-run.mjs agent
node harness/score.mjs baseline agent     # final comparison table
```

## Results

Ten React apps, starting mean Lighthouse score **66.6**.

| Metric | simple<br>(one prompt) | baseline<br>(tools, one pass) | **agent**<br>(guarded loop) |
|---|---|---|---|
| **Verified gain** | +5.8 | +32.6 | **+35.4** |
| Final mean score | — | 98.4 | **98.6** |
| Build failures | **8/10** | 0/10 | 0/10 |
| Behaviourally broken | 1/10 | 0/10 | **0/10** |
| Regressions caught and reverted | — | — | **5** |
| Wall clock, whole set | 24.9 min | 65 min | 77.2 min |

Ablations, isolating each component:

| Removed | Arm | Verified gain | Attribution |
|---|---|---|---|
| — | agent | +35.4 | |
| the revert guard | agent-norevert | +33.8 | guard: **+1.6** |
| rounds 2–3 | agent-1round | +23.2 | iteration: **+12.2** |
| the loop entirely | baseline | +32.6 | tool access: **+26.8** |

**Read this honestly.** The largest factor by far is tool access (+26.8), and none
of that is this project's design — it is the difference between a model that can
read the codebase and one that cannot. The loop's genuine contribution is
iteration (+12.2). The revert guard is worth +1.6 on average, which understates
it: across the guarded runs it stopped five regressions, three of which did not
compile. **It changes the worst case, not the average case.**

These are single runs of a non-deterministic system. The per-arm numbers carry
real variance, and the changelog says so where it matters.

Full detail: [results/comparison.md](results/comparison.md) and
[docs/CHANGELOG.md](docs/CHANGELOG.md), which records every iteration including the
three discarded verifier designs and the capability boundary that turned out not to
exist.

## Main failure mode and hot take

**Agents optimise what you measure, and every naive correctness check is also
changed by the correct fix.** Windowing removes DOM nodes; sizing images changes
page height; pre-rendering removes React. Each is the right fix, and each trips a
verifier built on node counts, page height, content position, or bundle size.

**Hot take: a permission flag is not a sandbox — an unverified capability boundary
is a claim, not a control.** This agent was configured so it could not measure its
own work, and it had a shell the whole time and was caught running `vite build` on
itself. Every run succeeded, every score was excellent, and nothing in the results
would ever have revealed it. Full version at the end of
[docs/CHANGELOG.md](docs/CHANGELOG.md).

## Deliverables

| | Where |
|---|---|
| Solution code + changelog | this repo, [docs/CHANGELOG.md](docs/CHANGELOG.md) |
| Reproduction guide | [docs/REPRODUCE.md](docs/REPRODUCE.md) |
| Video outline + narration script | [docs/VIDEO.md](docs/VIDEO.md), [docs/SCRIPT.md](docs/SCRIPT.md) |
| Agent trajectories | `results/trajectories-md/` (90 rendered), raw in `results/trajectories/` |
