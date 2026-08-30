# Reproduction guide

Written for someone starting from a clean machine who has never seen this repo.

## What you need

| Requirement | Version used | Notes |
|---|---|---|
| Node.js | 22.13.1 | any Node 20+ should work |
| npm | 10.9.2 | ships with Node |
| Google Chrome | stable, installed at the OS default path | `chrome-launcher` discovers it |
| Claude Code CLI | 2.1.251 | the model harness the agent drives |
| OS | Windows 10 (verified) | macOS/Linux should work; see the Windows note below |
| Disk | ~1.5 GB | `node_modules` plus per-run app copies |

No Anthropic API key is required. The agent drives the Claude Code CLI in
headless mode, which authenticates with your own Claude account.

## Setup

```bash
git clone <this repo>
cd hackathon-react-perf-agent
npm install
```

Install and authenticate the CLI:

```bash
npm install -g @anthropic-ai/claude-code
```

Then run `claude` once in an interactive terminal and use `/login`. Verify
headless mode works before going further — this should print `OK` and nothing else:

```bash
claude -p "Reply with exactly: OK" --model claude-opus-5
```

If you would rather use an API key than a subscription, export
`ANTHROPIC_API_KEY` and the CLI will pick it up instead.

## Running it

Each command writes JSON into `results/` and can be run independently. Later
steps read the output of earlier ones, so run them in this order the first time.

**1. Measure the eval set.** Builds all ten apps and records the starting state.

```bash
node harness/measure-all.mjs before 3
```

Expected: a table of ten scores from 45 to 99 and `mean score across 10 apps: 66.6`,
written to `results/before.json`. No model calls, so this is free and fast.

**2. Run the baseline arm.**

```bash
node baseline/run-baseline.mjs
```

**3. Run the agent arm.**

```bash
node agent/run-agent.mjs
```

**4. Verify behaviour for both arms.** This is applied to the finished runs by
the same code, after the fact — neither arm is told it will be checked.

```bash
node harness/verify-run.mjs baseline
```

```bash
node harness/verify-run.mjs agent
```

**5. Produce the comparison table.**

```bash
node harness/score.mjs baseline agent
```

Expected: `results/comparison.md`, also printed to stdout.

## Running one app

Every runner takes an optional app id, which is the fastest way to sanity-check
a fresh clone:

```bash
node agent/run-agent.mjs app-01-catalog
```

## Ablations

The agent's guard rails are switchable, which is how the changelog attributes
each component's effect. These reproduce the ablation arms:

```bash
VERIFY=off AGENT_LABEL=agent-noverify node agent/run-agent.mjs
```

```bash
REVERT=off AGENT_LABEL=agent-norevert node agent/run-agent.mjs
```

```bash
MAX_ROUNDS=1 AGENT_LABEL=agent-1round node agent/run-agent.mjs
```

On Windows PowerShell, set the variable first: `$env:VERIFY="off"`.

## Runtime and cost

| Step | Wall clock | Cost |
|---|---|---|
| `measure-all` | ~6 min | free — no model calls |
| baseline (10 apps) | ~75 min | ~10 model sessions |
| agent (10 apps × up to 3 rounds) | ~2–3 h | ~30 model sessions |
| `verify-run` per arm | ~8 min | free |
| `score` | instant | free |

On a Claude subscription the model calls are covered by your plan; you may hit
usage limits on a smaller plan, in which case run one app at a time. Against the
API instead, budget roughly $35–45 for a full baseline + agent + ablation sweep
at Opus 5 rates.

## What the numbers should look like

Lighthouse here uses **simulated** throttling, which replays a fixed network and
CPU model rather than racing your hardware. Repeated runs on one machine were
observed at ±0–3 points. Absolute scores may shift on very different hardware;
**relative** improvements are the claim, and `results/before.json` is regenerated
on your machine in step 1 so every comparison is against your own baseline.

## Windows note

`harness/run-claude.mjs` spawns the Claude Code binary directly with
`shell: false`. This is load-bearing: on Windows, `spawn` with `shell: true` does
not quote argv, so a multi-line prompt is split on whitespace and the model
receives only its first word — silently, with no error. If you port this, keep
`shell: false`.

## Data

All ten apps are synthetic and generated for this project. No third-party
repositories, no scraped content, no personal data, and no credentials are
present anywhere in the repo or in `results/`.

## Ablations that reproduce the attribution table

```bash
REVERT=off AGENT_LABEL=agent-norevert node agent/run-agent.mjs
```

```bash
MAX_ROUNDS=1 AGENT_LABEL=agent-1round node agent/run-agent.mjs
```

```bash
node harness/score.mjs simple baseline agent agent-norevert agent-1round
```

## Rendering trajectories

Raw stream-json is ~1 MB per round. This renders every trajectory as readable
markdown, joined to the harness verdict that followed it:

```bash
node harness/render-trajectory.mjs
```
