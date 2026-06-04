#!/usr/bin/env bash
#
# Derive .dev.vars from .env. The Cloudflare Workers runtime (`astro dev` /
# `astro preview` / Playwright) reads secrets from .dev.vars at request time;
# the API routes no longer fall back to import.meta.env (which would inline
# secrets into the built bundle). PUBLIC_ vars stay in .env — they are
# build-time client values, not Worker secrets.
#
# Usage: bash scripts/gen-dev-vars.sh   (run automatically by `pnpm env:pull`)

set -euo pipefail

[ -f .env ] || {
  echo ".env not found — run 'pnpm env:pull' first."
  exit 1
}

grep -vE '^[[:space:]]*#|^[[:space:]]*$|^PUBLIC_' .env > .dev.vars
echo "Wrote .dev.vars ($(grep -cE '.' .dev.vars) vars)."
