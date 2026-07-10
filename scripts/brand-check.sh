#!/usr/bin/env bash
# Brand verification: ensures no legacy naming references remain in the
# repository's source tree. Runs in CI to catch accidental drift from the
# canonical MilestoneX naming conventions documented in
# docs/BRAND_GUIDELINES.md.
#
# Intentional exclusions:
#   * This script itself           — it must drive the legacy-token scan
#   * CHANGELOG.md                 — historical migration entries
#   * docs/BRAND_GUIDELINES.md     — historical migration note
#   * package-lock.json            — auto-regenerated from package.json
#
# Note: only the specific files above are excluded; new files that
# accidentally reintroduce a legacy name will still be flagged.
set -euo pipefail
ROOT=$(git rev-parse --show-toplevel)

# Bracket-obfuscated pattern: each literal legacy variant is broken into
# a character class so the source token never appears in this file.
PATTERN='[o]rbit|[O]rbit[C]hain|[O]RBIT[C]HAIN|[o]rbit[c]hain'

HITS=$(grep -rli \
        --exclude-dir=node_modules \
        --exclude-dir=.next \
        --exclude-dir=.git \
        --exclude='CHANGELOG.md' \
        --exclude='BRAND_GUIDELINES.md' \
        --exclude='package-lock.json' \
        --exclude='brand-check.sh' \
        -E "$PATTERN" \
        "$ROOT" 2>/dev/null || true)
if [[ -n "$HITS" ]]; then
    echo "FAIL: leftover legacy naming references in:" >&2
    echo "$HITS" >&2
    exit 1
fi
echo "MilestoneX brand check: PASS"
