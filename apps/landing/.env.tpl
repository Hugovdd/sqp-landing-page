# 1Password secret-reference template — SAFE TO COMMIT (these are pointers, not values).
#
# Regenerate the real (gitignored) .env on any machine:
#   1. brew install 1password-cli   # one-time
#   2. enable: 1Password app → Settings → Developer → "Integrate with 1Password CLI"
#   3. pnpm env:pull                 # runs: op inject -i .env.tpl -o .env
#
# The references below assume a 1Password item named "sqp-landing-page" in your
# "Private" vault, with one field per variable. If your vault/item differs,
# update the op:// paths here (format: op://<vault>/<item>/<field>).

MAILGUN_API_KEY=op://Private/sqp-landing-page/MAILGUN_API_KEY
MAILGUN_DOMAIN=op://Private/sqp-landing-page/MAILGUN_DOMAIN
MAILGUN_EU=op://Private/sqp-landing-page/MAILGUN_EU
SUBSCRIBE_SECRET=op://Private/sqp-landing-page/SUBSCRIBE_SECRET
PUBLIC_TURNSTILE_SITE_KEY=op://Private/sqp-landing-page/PUBLIC_TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY=op://Private/sqp-landing-page/TURNSTILE_SECRET_KEY
SHADCNBLOCKS_API_KEY=op://Private/sqp-landing-page/SHADCNBLOCKS_API_KEY
