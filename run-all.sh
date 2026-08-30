#!/usr/bin/env bash
# Full evaluation sweep. Every arm runs with tool capability genuinely enforced
# via --disallowedTools (see harness/run-claude.mjs), then is behaviourally
# verified after the fact by the same code.
set -x
node baseline/run-simple.mjs
node harness/verify-run.mjs simple
node baseline/run-baseline.mjs
node harness/verify-run.mjs baseline
node agent/run-agent.mjs
node harness/verify-run.mjs agent
node harness/render-trajectory.mjs
node harness/score.mjs simple baseline agent
