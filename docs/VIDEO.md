# Video outline — 5 minutes

Six shots. Timings are targets; the whole thing is recordable in one take with the
terminal and this repo open. Talking points are written as things to *say*, not to
read aloud verbatim.

Have these ready in tabs before recording:
- a terminal in the repo root
- `results/comparison.md`
- `docs/CHANGELOG.md`
- `results/trajectories-md/agent-app-07-report-r3.md` (the reverted round)

---

## Shot 1 — The problem (0:00–0:40)

Show `apps/app-08-shop/src/main.jsx` on screen, then its starting score.

> "This app scores 47 out of 100. Lighthouse tells me Total Blocking Time is 2.8
> seconds. It does not tell me that the cause is a currency formatter being
> constructed twice per comparison inside a sort over 3000 products. That gap —
> between a metric and a line of code — is the work, and it's the part tooling
> doesn't do."

Say who the user is in one line: a frontend developer with a performance budget
and a release date.

## Shot 2 — The baseline (0:40–1:20)

```bash
node baseline/run-simple.mjs app-08-shop
```

Don't wait for it live — cut to the finished result.

> "The simplest reasonable approach: paste the source into one prompt, apply what
> comes back. On this app it works — 47 to 99. Across all ten, eight of them
> didn't compile. That's the honest hit rate for one-shot prompting."

## Shot 3 — One real execution, start to finish (1:20–3:00)

**This is the heart of the video.** Show the agent running on `app-08-shop`:

```bash
AGENT_LABEL=demo node agent/run-agent.mjs app-08-shop   # already run; log in results/demo-run.log
```

Narrate the loop as the three rounds land (**47 → 74 → 97 → 100**, 3 rounds kept, 0 reverted, behaviour OK):

> "The harness measures, then hands the numbers to the model — the model never
> gets a build tool, so it can't grade its own work. One targeted change per
> round. After each one the harness rebuilds, re-measures, and drives a real
> browser to check the app still behaves the same. If any of that fails, the whole
> round is reverted."

Point out that each round attacks a different bottleneck, because the model is
told the result of the last one.

## Shot 4 — The guard firing (3:00–3:40)

Open `results/trajectories-md/agent-app-07-report-r3.md` and scroll to the
**Harness verdict** section.

> "Round 3 on the report app looked reasonable and scored 84, down from 94. It was
> reverted. Across thirty rounds the guard fired five times — three produced code
> that didn't compile at all. In a single-pass agent, every one of those ships.
> The loop's contribution isn't a higher ceiling. It's a floor."

## Shot 5 — The comparison (3:40–4:20)

Show the headline table from `results/comparison.md`.

| Metric | simple | baseline | agent |
|---|---|---|---|
| Verified gain | +5.8 | +32.6 | +35.4 |
| Build failures | 8/10 | 0/10 | 0/10 |
| Reverted by guard | — | — | 5 |

> "Be clear about where the gain comes from. The jump from +5.8 to +32.6 is tool
> access, not my orchestration. My loop adds 2.8 points on top of that, plus five
> regressions that never shipped. Claiming the harness caused a thirty-point
> improvement would be wrong, so I'm not claiming it."

Mention the primary metric in one line: a Lighthouse point only counts if the app
still behaves the same afterwards, checked in a real browser.

## Shot 6 — What I removed, and the hot take (4:20–5:00)

Open `docs/CHANGELOG.md` at **Step 2b**.

> "The experiment I removed: I configured each arm with `--allowedTools` and
> believed the agent had no shell. It's an auto-approval list, not a capability
> restriction. The agent had Bash the whole time and was running `vite build` on
> itself — the exact thing my design says it can't do. Every run succeeded, every
> score looked great, and the central claim was false. I found it by reading a
> trajectory, not a result. I threw away the baseline run and redid it."

Close on the hot take:

> "A permission flag is not a sandbox. An unverified capability boundary is a
> claim, not a control — and nothing in your results will ever tell you it's
> broken. Next time I build an agent, every capability claim gets a test that
> tries to violate it."

---

## Recording notes

- Pre-run everything. Live model calls take 1–5 minutes per round; cut to results.
- If you only have time for one thing, make it **Shot 3** — a full execution with
  the loop narrated — and **Shot 6**, the removed experiment. Those two carry the
  submission.
- Say the numbers out loud. Judges are checking that claims match evidence.
- Don't oversell. The strongest moment in this video is admitting the orchestration
  contributed less than tool access.
