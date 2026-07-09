#!/usr/bin/env bash
# Brand verification: ensures no leftover OrbitChain references in the
# repository's source tree. Runs in CI to catch accidental regressions
# during the post-MilestoneX rebrand.
set -euo pipefail
ROOT=$(git rev-parse --show-toplevel)
HITS=$(grep -rli \
        --exclude-dir=node_modules \
        --exclude-dir=.next \
        --exclude-dir=.git \
        --exclude='package-lock.json' \
        -E 'orbit|OrbitChain|ORBITCHAIN|orbitchain' \
        "$ROOT" 2>/dev/null || true)
if [[ -n "$HITS" ]]; then
    echo "FAIL: leftover OrbitChain references in:" >&2
    echo "$HITS" >&2
    exit 1
fi
echo "MilestoneX brand check: PASS"
