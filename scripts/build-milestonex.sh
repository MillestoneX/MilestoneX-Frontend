#!/usr/bin/env bash
# Convenience wrapper: builds the @milestonex/web frontend.
set -euo pipefail
npm ci
npm run build
