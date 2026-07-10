#!/usr/bin/env bash
# Brand verification: ensures no leftover OrbitChain references in the
# repository's source tree. Runs in CI to catch accidental regressions
# during the post-MilestoneX rebrand.
#
# Intentional exclusions:
#   * This script itself           — it must reference OrbitChain to detect it
#   * CHANGELOG.md                 — historical migration entry
#   * docs/BRAND_GUIDELINES.md     — historical migration note
#   * package-lock.json            — auto-regenerated from package.json
#
# Note: only the specific files above are excluded; new docs that
# accidentally reintroduce OrbitChain will still be flagged.
set -euo pipefail
ROOT=$(git rev-parse --show-toplevel)
HITS=$(grep -rli \
        --exclude-dir=node_modules \
        --exclude-dir=.next \
        --exclude-dir=.git \
        --exclude='CHANGELOG.md' \
        --exclude='BRAND_GUIDELINES.md' \
        --exclude='package-lock.json' \
        --exclude='brand-check.sh' \
        -E 'orbit|OrbitChain|ORBITCHAIN|orbitchain' \
        "$ROOT" 2>/dev/null || true)
if [[ -n "$HITS" ]]; then
    echo "FAIL: leftover OrbitChain references in:" >&2
    echo "$HITS" >&2
    exit 1
fi
echo "MilestoneX brand check: PASS"
