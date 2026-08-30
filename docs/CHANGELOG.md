# Improvement Changelog

Every entry is a real experiment, measured with `harness/measure.mjs` (Lighthouse
median-of-3, mobile preset, simulated 4G + 4x CPU throttling) on the same eval set.

---

## Step 0 — Instrument before building (pre-baseline)

**What I tried and why.** Before writing any agent, I needed to know the primary
metric could actually move. Local builds have no network latency, so Lighthouse
can pin near 100 and leave no headroom — that would have invalidated every later
claim. I built two probe apps rendering identical UI: one with a 1.5 MB eager
import, 9M-iteration blocking loop on module evaluation, and 6000 unvirtualized
rows; one paginated and lean.

**Evidence.**

| Probe | LH score | FCP | LCP | TBT | JS bundle | Spread over 3 runs |
|---|---|---|---|---|---|---|
| `probe-slow` | 49 | 9002 ms | 9152 ms | 346 ms | 1636.9 KB | ±0 |
| `probe-fast` | 99 | 1502 ms | 1652 ms | 0 ms | 146.5 KB | ±0 |

**Decision / learning.** Kept. 50 points of headroom, so the metric has room to
move. The surprise was the ±0 spread: Lighthouse's *simulated* throttling replays
a fixed network/CPU model rather than racing real hardware, so repeated runs are
deterministic. That means measured deltas are signal, not noise — and another
person on different hardware gets comparable numbers. Median-of-3 is retained
anyway as a guard against nondeterminism on other machines.

---

## Step 0b — A planted anti-pattern that never reached the browser

**What I tried and why.** `app-05-admin` was seeded with two anti-patterns from the
web.dev catalog: a namespace import (`import * as utils`) of an 839 KB utility
module, and five route panes with no code splitting. Expected a poor score.

**Evidence.** It scored **99/100** with a 144 KB JS bundle — the highest in the set.

| App | LH score | JS bundle | Source module |
|---|---|---|---|
| `app-05-admin` | 99 | 144.3 KB | 839 KB |

Rollup tree-shook the namespace import: only `helper0`–`helper4` are statically
referenced, so the other 895 exports never entered the bundle.

**Decision / learning.** Kept, but **relabelled as a negative control** rather than
removed. Two reasons. First, it is honest: the anti-pattern is real in source and
absent in the artifact, and a source-only reviewer would "fix" a problem that does
not exist. Second, it is the most useful case in the set — it measures **false
positives**. The correct action here is to change little or nothing, and any run
that regresses its 99 is penalised. `harness/ground-truth.json` now lists no
anti-patterns for this app.

The lesson generalises: **an anti-pattern in source is not a defect in production.**
Any perf tool that reasons only over source code will confidently fix things the
compiler already handled. This is why the harness measures the built artifact.

---

## Step 1 — The baseline was far stronger than expected

**What I tried and why.** The first comparison arm was "one general-purpose agent
with basic tools" (a baseline shape the brief lists): the Claude Code CLI in
headless mode with `Read`/`Edit`/`Write`/`Glob`/`Grep`, one pass per app, no build
tool and no measurement. The expectation was a mediocre arm that a properly
orchestrated agent would clearly beat.

**Evidence.**

| | Before | After |
|---|---|---|
| Mean Lighthouse score | 66.6 | **98.4** |
| Lowest app score | 45 | 94 |
| Build failures | — | 0/10 |
| Mean wall clock | — | 7.4 min/app (~35 tool calls) |

It was also *good* work rather than metric-gaming. On `app-01-catalog` it replaced
a 1.8 MB data literal with a generator emitting identical objects, added windowing
with measured row heights and overscan, hoisted style objects out of render, and
precomputed lowercased names so filtering does not re-lower 6000 strings per
keystroke. All 6000 records still render.

**Decision / learning.** Kept, but it demolished the planned headline. At 98.4
there are 1.6 points of headroom, so "the agent scores higher" is not a claim this
data can support, and no amount of orchestration will change that.

The finding is worth more than the claim it destroyed: **on self-contained apps of
this size, a general-purpose coding agent with file access is already close to the
ceiling for load performance.** The interesting axis is not whether the score goes
up. It is what an arm does when there is nothing to fix, and whether anything
catches it when it is wrong.

This is why a second, weaker baseline was added in Step 2 — not to manufacture a
gap, but because the canonical "one direct prompt" arm is the one that isolates
what tool access and iteration are actually worth.

---

## Step 1b — The verifier failed three times, and each failure was instructive

**What I tried and why.** With the baseline near ceiling, correctness became the
interesting variable: does a one-shot agent silently break things? Answering that
needs a behavioural check that survives *correct* optimisations. Three designs
were tried, each measured against the same 10 baseline outputs.

**Evidence.**

| Verifier design | Apps flagged | Verdict on the flags |
|---|---|---|
| v1 — gate on scroll height (±5%) | 4/10 | **All false positives.** Identical text top and bottom, zero console errors. Adding `width`/`height` to images is the textbook CLS fix and legitimately changes page height. |
| v2 — content profile at 24 page fractions | 5/10 | **False positives.** When a page grows 30% taller, the same record sits at a different fraction. |
| v3 — v2 with ±1 sample alignment tolerance | 5/10 | **Still false positives.** The drift is structural, not positional: once sized images make each row taller, three viewport probes land on the *same* record instead of three. |

`app-08-shop` was adjudicated by hand as the most suspicious case — its records
appeared reordered. The baseline's rewrite preserves ordering exactly (the same
locale comparison, hoisted out of the comparator with the formatter memoised).
What v2 and v3 were detecting was 250-card progressive rendering racing the
sampler.

**Decision / learning.** The positional profile was **demoted to an informational
note**, not deleted — a large divergence still deserves a human look. The hard
gates are now only the checks that are exact and drift-free: above-the-fold text,
text at the bottom after scrolling to it, the result of a filter interaction, and
an error-free console. On apps that display a record count ("6000 of 6000 parts"),
the head-text gate doubles as the data-loss gate.

The lesson is the one worth carrying out of this project: **the hard part of
verifying an optimisation is that the correct fix changes the page too.** Every
naive invariant — node counts, page height, content position, whole-page text — is
also changed by windowing, image sizing, or reflow. A verifier built on those
punishes exactly the fixes you wanted. Three designs in, the honest answer was to
narrow the gate to what cannot drift and to say plainly what is no longer covered.

And the headline result of the exercise is a negative one: **there is no evidence
the strong baseline broke any of the 10 apps.** The predicted story — "verification
catches the one-shot agent breaking things" — is not supported and was not
manufactured.

---

## Step 2 — Adding the canonical one-prompt baseline

**What I tried and why.** With the tool-using baseline near ceiling, the comparison
had no room to say anything. The brief's first-listed baseline shape — "one direct
prompt with basic instructions" — isolates what tool access and iteration are
worth. Source files are pasted into a single call, the model replies with complete
rewritten files, and the harness writes them out. No tools, no repo access, no
build, no measurement, no second attempt.

**Stated resource difference.** This arm cannot see files it was not handed, and
any file over 20,000 characters is truncated in the prompt. That is not a handicap
imposed for effect — it is the actual constraint of one-shot prompting. A 1.7 MB
generated data module does not fit in a prompt, which is the whole reason the
approach struggles on real codebases.

**Evidence (single-app probe, `app-04-blog`).**

| Arm | Score | Time |
|---|---|---|
| one prompt, no tools | 72 → 93 | 176 s |
| tool-using baseline | 72 → 99 | 252 s |
| agent loop | 72 → 92 → 99 | 289 s, 2 rounds kept, 0 reverted |

**Decision / learning.** Kept, and **both** baselines are reported. Dropping the
strong one would have made the result look better and been dishonest; the
comparison is only meaningful when the reader can see that most of the gain comes
from tool access, not from orchestration.

---

## Step 2b — The tool restriction was not restricting anything

**What I tried and why.** Each arm is defined by what it can do, so the arms were
configured with `--allowedTools`: the one-shot arm got none, the tool-using arms
got `Read`/`Edit`/`Write`/`Glob`/`Grep`. The agent's headline design property —
*the harness measures, the model never grades its own work* — depends entirely on
the model not having a shell.

This was only caught because the trajectory renderer for deliverable #4 prints the
tool list from the session's own init event.

**Evidence.**

| | Tools the session actually exposed | Bash calls made |
|---|---|---|
| Configured `--allowedTools Read Edit Write Glob Grep` | Task, Artifact, **Bash**, Edit, Glob, Grep, Read, Write, WebFetch, WebSearch, … (30) | **9** |
| Configured `--disallowedTools …` (one-shot arm) | only inert tools; no file or shell access | 0 |

`--allowedTools` is an **auto-approval allowlist, not a capability restriction**. It
says which tools skip the permission prompt; it does not remove the rest. The agent
had a shell the whole time and was observed running
`npx vite build --config …/app-04-blog/vite.config.js` in round 2 — measuring its
own work, which is exactly the thing the design claims it cannot do.

**Decision / learning.** Fixed by deriving an explicit deny list — every known tool
minus the allowed ones — and passing both flags. Verified by asking a restricted
session to run `echo hello`: tools exposed are now exactly `Edit, Glob, Grep, Read,
Write` and the model replies `BASH_BLOCKED`.

The completed baseline run was **discarded and re-run**, and the original kept as
`results/baseline-unrestricted.json` — an unrestricted arm is a legitimate extra
data point, but it cannot be the one labelled "no measurement access".

The lesson is the sharpest in this project: **a permission flag is not a sandbox,
and an unverified capability boundary is a claim, not a control.** The
configuration looked right, the runs succeeded, the scores were excellent, and the
central design property was false the whole time. Nothing in the results would
ever have revealed it — only reading what the agent actually did. Every capability
claim in an agent's design deserves a test that tries to violate it.

---

## Step 3 — The agent loop, measured

**What I tried and why.** The full loop: measure → one targeted patch → rebuild →
re-measure → verify behaviour → keep or revert the round whole, up to 3 rounds.
Same model and same five tools as the strong baseline; the only difference is
iteration and the gates.

**Evidence.**

| Metric | simple (one prompt) | baseline (tools, one pass) | agent (loop) |
|---|---|---|---|
| **Verified gain** | **+5.8** | **+32.6** | **+35.4** |
| Apps behaviourally broken | 1/10 | 0/10 | 0/10 |
| Build failures | **8/10** | 0/10 | 0/10 |
| Rounds reverted by the guard | — | — | **5** |
| Wall clock, whole set | 24.9 min | 65 min | 77.2 min |

**What the guard actually caught**, across 30 rounds:

| App | Round | What happened | Action |
|---|---|---|---|
| app-02-dashboard | 3 | produced code that did not compile | reverted |
| app-05-admin | 1 | produced code that did not compile | reverted |
| app-10-analytics | 1 | produced code that did not compile | reverted |
| app-04-blog | 3 | score fell 99 → 93 | reverted |
| app-07-report | 3 | score fell 94 → 84 | reverted |

**Decision / learning.** Kept. Three things are worth separating honestly:

1. **Most of the gain is tool access, not orchestration.** +5.8 → +32.6 is the
   jump from one-shot prompting to a model that can read and edit files. The loop
   adds +2.8 on top. Anyone claiming their harness is the reason for a 30-point
   improvement here would be wrong.
2. **The loop's real contribution is a floor, not a ceiling.** Five rounds out of
   thirty produced code that was worse than what it replaced — three of them did
   not compile at all. In a single-pass arm every one of those ships. The agent's
   guarantee is that the app cannot end worse than it started, and that guarantee
   was exercised on 5 of 10 apps.
3. **Iteration helps most where one pass does worst.** On the two apps where the
   baseline struggled, the agent's extra rounds mattered: app-07 scored 94 vs the
   baseline's 77, app-06 99 vs 89.

The one-shot arm's 8/10 build failure rate is the other half of the story. Pasting
source into a prompt and applying the reply is not a workflow that produces
working software at this size — its two successes were real, but a 20% hit rate is
the honest characterisation.

---

## Step 3b — A blind spot found by reading the output, not the score

**What I tried and why.** The agent's final bundles looked wrong: 1.7 KB on
`app-07-report`, 6 KB on `app-05-admin`, 2 KB on `app-10-analytics`. React alone is
about 140 KB, so these numbers were not possible for a React app that still worked.

**Evidence.** On `app-05-admin` the agent had removed React entirely, pre-rendering
the markup into a 30 KB `index.html` with 6 KB of hand-written JavaScript for the
tab behaviour. Every behavioural gate passed — because the rendered markup was
identical. But the tabs are `<button>` elements and **the verifier only ever
exercised `<input>`**. Clicked by hand, the tabs behave identically in both
versions with zero console errors, so the rewrite is sound.

**Decision / learning.** The rewrite was correct, and the suite had no way of
knowing that — which is the same as not having checked. A button-interaction gate
was added and all three arms re-verified; the results were unchanged (agent 0/10,
baseline 0/10, simple 1/10).

The lesson pairs with Step 2b: **a green suite means the checks you wrote passed,
not that the system is correct.** Both of this project's near-misses were found by
reading what the agent actually did — the tool list in a trajectory, an impossible
bundle size — and neither would ever have surfaced in a score.

---

## Step 4 — Ablations: what each component is actually worth

**What I tried and why.** Three claims needed separating: that tool access matters,
that iteration matters, and that the revert guard matters. Each guard is a switch
(`REVERT=off`, `MAX_ROUNDS=1`), so each can be removed and re-measured on the same
eval set.

**Evidence.**

| Arm | Verified gain | Wall clock | What it isolates |
|---|---|---|---|
| simple — one prompt, no tools | +5.8 | 24.9 min | the floor |
| baseline — tools, one pass | +32.6 | 65 min | **tool access: +26.8** |
| agent-1round — loop, 1 round | +23.2 | 16.7 min | one guarded round |
| agent-norevert — 3 rounds, no revert | +33.8 | 56.2 min | iteration without the guard |
| **agent — 3 rounds, guarded** | **+35.4** | 77.2 min | **iteration: +12.2; guard: +1.6** |

**Decision / learning.** All kept, with the contributions stated at their real size:

- **Tool access is worth +26.8** — by far the largest single factor, and none of it
  is my design. It is the difference between a model that can read the codebase and
  one that cannot.
- **Iteration is worth +12.2** (+23.2 for one round → +35.4 for three). This is the
  agent's genuine contribution. Later rounds attack different bottlenecks because
  the model is told what the previous round actually achieved.
- **The revert guard is worth +1.6 on average — and that number understates its
  variance, which is the honest finding here.** In the main run the guard fired 5
  times out of 30 rounds, three of those on code that did not compile. In the
  no-revert arm the model simply did not produce a catastrophic round, and nothing
  broke. Same configuration, different dice.

**The caveat that matters: n=1 per arm.** These are single runs of a
non-deterministic system. The +1.6 attributed to the guard is one sample of a
quantity whose spread is clearly larger than its mean — a run where it catches
three build failures and a run where it catches none are both normal. The
defensible claim is *not* "the guard is worth 1.6 points". It is: **the guard
changes the worst case, not the average case.** Across the two guarded runs it
prevented five regressions from shipping; on the average it is nearly free. That is
what insurance looks like, and averaging it away would misrepresent it.

`agent-1round` is also the efficiency answer: **+23.2 in 16.7 minutes**, versus
+35.4 in 77 minutes. If the whole eval set has to be processed under time pressure,
one guarded round delivers two thirds of the benefit in a fifth of the time.

---

## Final — what this project actually shows

**Result.** On ten React applications, a guarded measure-patch-verify loop raised
the mean Lighthouse score from **66.6 to 98.6** with **no behavioural regressions**,
against **+5.8** for one-shot prompting and **+32.6** for a single-pass agent with
file access.

**Main contribution.** Iteration with measured feedback (+12.2), plus a revert
guard that stopped five regressions — three of them non-compiling — from reaching
the final state.

**What I am not claiming.** That the orchestration produced the 32-point gain. It
did not; tool access did. On self-contained apps of this size, a general-purpose
coding agent with file access is already close to the ceiling for load performance,
and any harness built on top is arguing over the last few points.

## Main failure mode

**Agents optimise the thing you measure, and every naive correctness check is also
changed by the correct fix.** Windowing a long list removes thousands of DOM nodes.
Sizing an image changes page height. Removing per-word spans changes reflow.
Pre-rendering removes React entirely. Each of those is the *right* fix, and each one
trips a verifier built on node counts, page height, content position, or bundle
size. Three verifier designs were discarded to this before the gate was narrowed to
invariants that cannot drift — and the narrowing is itself a loss of coverage that
has to be stated rather than hidden.

## Hot take

**A permission flag is not a sandbox. An unverified capability boundary is a claim,
not a control.**

The agent was configured with `--allowedTools Read Edit Write Glob Grep` and the
design said it could not measure its own work. That flag is an auto-approval list,
not a capability restriction. The agent had a shell the entire time and was caught
running `npx vite build` on itself. Every run succeeded. Every score was excellent.
The central design property was false, and **nothing in the results would ever have
revealed it** — it surfaced only from reading the tool list printed in a trajectory.

The same pattern produced the second near-miss: an impossible 1.7 KB bundle led to
an agent rewrite that had replaced React with pre-rendered HTML, which the suite
passed because it had never clicked a button.

Both were found by reading what the agent *did*, not what it *scored*. So: every
capability claim in an agent's design gets a test that tries to violate it, and
every result that looks too good gets read rather than recorded. A green suite means
the checks you wrote passed. It does not mean the system is correct.
