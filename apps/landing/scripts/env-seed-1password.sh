#!/usr/bin/env bash
#
# One-time: create a 1Password item from the current local .env so it becomes
# the source of truth. After this, `.env` can be regenerated anywhere with
# `pnpm env:pull`. Re-run to recreate the item if secrets rotate (delete the old
# item first, or edit fields directly in the 1Password app).
#
# Usage:  bash scripts/env-seed-1password.sh [vault]   (default vault: Private)
# Requires: 1Password CLI (`op`) installed and signed in.

set -euo pipefail

VAULT="${1:-Private}"
ITEM="sqp-landing-page"
ENV_FILE=".env"

command -v op >/dev/null 2>&1 || { echo "1Password CLI (op) not found. Install: brew install 1password-cli"; exit 1; }
[ -f "$ENV_FILE" ] || { echo "$ENV_FILE not found. Nothing to seed."; exit 1; }

# Build one concealed field per non-empty .env key.
fields=()
while IFS='=' read -r k v; do
  case "$k" in ''|\#*) continue;; esac
  k="$(printf '%s' "$k" | xargs)"
  [ -z "$k" ] && continue
  v="${v%$'\r'}"                       # strip trailing CR if present
  [ -z "$(printf '%s' "$v" | xargs)" ] && continue
  fields+=("${k}[password]=${v}")
done < "$ENV_FILE"

echo "Creating 1Password item \"$ITEM\" in vault \"$VAULT\" with ${#fields[@]} fields..."
op item create --category "Secure Note" --title "$ITEM" --vault "$VAULT" "${fields[@]}" >/dev/null
echo "Done. Verify the op:// paths in .env.tpl match vault=\"$VAULT\" item=\"$ITEM\", then test: pnpm env:pull"
