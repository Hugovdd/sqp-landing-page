# Telemetry

Anonymous, always-on usage and crash telemetry for the Sidequest Plugins CEP panels
(AE Sheets and Binance Localiser). Payloads carry no PII and no project content; the
telemetry population *is* the whole user base (no opt-out), so counts are treated as exact.

## Language

**installId**:
A random UUID minted once when a plugin is installed and stored in the CEP panel's
persistent prefs. Per-install, not per-person and not per-machine: reinstalling or
installing on another machine yields a new `installId`, and that counts as a new install.
_Avoid_: userId, deviceId, machineId (it is none of these).

**Install**:
A distinct `installId` ever seen. "Installs" counts installations, not humans — a single
person who reinstalls is counted twice.
_Avoid_: user, signup.

Two timestamps, deliberately distinct:
- **firstSeen** — first time we received *any* event from this `installId`. Defines the
  active base (every install that has phoned home), so an install whose `app_installed` we
  never saw still counts.
- **installedAt** — set only when an actual `app_installed` event arrives; null for installs
  that predate telemetry. **"New installs/day" charts `installedAt`**, so switching telemetry
  on for an existing user base does not register the back-catalogue as new installs.

**Brand**:
The wire-level field identifying which client a payload comes from — `ae` or `binance`.
One `installId` belongs to exactly one brand. Internal/wire dimension only: the dashboard
no longer filters by brand directly but groups brands into user-facing **products** (see
below). `binance` is an AE Sheets sub-version, not a peer plugin. The set of accepted
brands is **derived from the product registry** (`packages/shared/src/products.ts`,
`BRANDS`) — the ingest validator rejects any brand not listed there, so the registry
doubles as the ingest accept-list.
_Avoid_: app (reserve "app" for the envelope's `app{}` block).

**Product**:
The user-facing unit Sidequest Plugins ships, and the dashboard's primary filter dimension
(the sidebar product switcher scopes every metric). A product maps to one or more brands:
**AE Sheets** = `ae` + `binance`; **Find and Replace Fonts** and **Altar** are defined in the
shared product registry (`packages/shared/src/products.ts`, `PRODUCT_REGISTRY`) — the single
source of truth from which both the ingest validator's accepted brands and the dashboard
switcher derive — and will carry data once their clients integrate. Resolved to
`brand IN (...)` at query time. Adding a product is one registry edit; see
`docs/ONBOARDING-TELEMETRY.md`.

**Session**:
A once-per-day heartbeat emitted by the panel (deduped client-side to roughly one per
local day of use). Powers active-user counts. Carries no per-open detail — it answers
"was this install active that day?", nothing finer.
_Avoid_: visit, pageview, login.

**Day** (for active-user bucketing):
The UTC calendar date of the server's `receivedAt`, never the client `ts`. Time is trusted
the same way location is: server-side only. One active install = one `(installId, Day)` pair.

**DAU / MAU**:
Distinct active `installId`s for a single **Day** (DAU) or over a trailing 28-day window
(MAU). Counts installs, not humans (see **Install**).
_Avoid_: "monthly" meaning a calendar month — MAU here is a rolling 28-day window.

**Latest-seen** (breakdown semantics):
An install's `os`, `appVersion`, and `country` reflect its **most recent** Session, not its
state at install — the daily heartbeat overwrites them. So "OS / version / geography
breakdown" means the *current live* user base, and a travelling install moves on the map to
where it was last active.
_Avoid_: reading any breakdown as "at install time".

# Altar beta lifecycle

The Altar-only People page reads the product's existing waitlist D1 through the read-only
`ALTAR_WAITLIST` dashboard binding. It is an admin projection, not another source of lifecycle state.

**Waitlist Entry**:
One email address's beta-access intent. `pending` is not access. Historical `invited` rows remain
valid manual/legacy email-bound grants because their provenance cannot be reconstructed safely.

**Access Invite**:
A single-use credential issued to an intended email. Issuance is recorded in `invite_codes` and does
not change the Waitlist Entry's grant status. The verified Account that claims it may use a different
email, so intended and claimed identities must always remain visible as separate fields.

**Account**:
The verified Clerk identity that claims an Access Invite. `waitlist.status='joined'` records access
for its verified email. `first_signed_in_at` ends this page's lifecycle at the first successful Altar
panel sign-in. Team Membership is a separate axis and is not inferred here.
