#!/usr/bin/env bash
#
# Build-hygiene guard: fail if any high-entropy server-secret VALUE got inlined
# into the compiled worker bundle (dist/server compiled JS), and warn if the
# public Turnstile site key is missing from the client build.
#
# Only genuine secrets are checked. Low-entropy / public config values are
# skipped because they legitimately appear as literals in the code:
#   - MAILGUN_EU / MAILGUN_REGION   → "true"/"eu" etc. match boolean/string literals
#   - CONTACT_TO_EMAIL              → matches the hardcoded public fallback address
#   - any value shorter than MIN_LEN
#
# Secret values are read from .dev.vars (or .env if absent). In a clean CI prod
# build with no local secret files, there is nothing to grep for and the check
# passes trivially — which is correct (nothing was inlined).
#
# Usage: bash scripts/check-build-secrets.sh   (run by deploy:* after build)

set -euo pipefail

DIST_SERVER="dist/server"
DIST_CLIENT="dist/client"
MIN_LEN=12
SKIP_KEYS="MAILGUN_EU MAILGUN_REGION CONTACT_TO_EMAIL"

[ -d "$DIST_SERVER" ] || { echo "No $DIST_SERVER — run 'pnpm build' first."; exit 1; }

SRC=""
if [ -f .dev.vars ]; then SRC=".dev.vars"; elif [ -f .env ]; then SRC=".env"; fi

# Only scan compiled JS (NOT the staged dist/server/.dev.vars, which wrangler
# never deploys). find+grep avoids the BSD-grep `--include`-after-`--` pitfall.
JS_FILES=$(find "$DIST_SERVER" \( -name "*.mjs" -o -name "*.js" \) -type f)

leaked=0
if [ -n "$SRC" ] && [ -n "$JS_FILES" ]; then
  while IFS='=' read -r k v; do
    case "$k" in ''|\#*|PUBLIC_*) continue;; esac
    for skip in $SKIP_KEYS; do [ "$k" = "$skip" ] && continue 2; done
    v="${v%$'\r'}"
    [ "${#v}" -lt "$MIN_LEN" ] && continue
    if printf '%s\n' "$JS_FILES" | xargs grep -lF -- "$v" 2>/dev/null | grep -q .; then
      echo "  ❌ LEAK: value of $k is inlined in the compiled worker JS"
      leaked=1
    else
      echo "  ✅ $k — not in compiled JS"
    fi
  done < "$SRC"
fi

# Non-fatal: the client widget needs the public site key inlined at build time.
PUB=""
[ -f .env ] && PUB=$(grep '^PUBLIC_TURNSTILE_SITE_KEY=' .env 2>/dev/null | cut -d= -f2- | tr -d '\r' || true)
if [ -n "$PUB" ] && grep -rqF -- "$PUB" "$DIST_CLIENT" 2>/dev/null; then
  echo "  ✅ PUBLIC_TURNSTILE_SITE_KEY present in client build"
elif [ -n "$PUB" ]; then
  echo "  ⚠️  PUBLIC_TURNSTILE_SITE_KEY not found in $DIST_CLIENT — contact form may fail closed"
fi

[ "$leaked" -eq 0 ] || { echo "BUILD SECRET CHECK FAILED"; exit 1; }
echo "Build secret check: CLEAN ✅"
