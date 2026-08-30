#!/usr/bin/env bash
# Ablations: remove one guard at a time to attribute its contribution.
set -x
REVERT=off AGENT_LABEL=agent-norevert node agent/run-agent.mjs
node harness/verify-run.mjs agent-norevert
MAX_ROUNDS=1 AGENT_LABEL=agent-1round node agent/run-agent.mjs
node harness/verify-run.mjs agent-1round
node harness/score.mjs simple baseline agent agent-norevert agent-1round
