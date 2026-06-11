# Telemetry

Anonymous, always-on usage and crash telemetry for the SideQuest Plugins CEP panels
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
Which plugin a payload comes from — `ae` (AE Sheets) or `binance` (Binance Localiser).
One `installId` belongs to exactly one brand; a machine running both plugins has two
`installId`s. The primary filter dimension across the dashboard.
_Avoid_: product, app (reserve "app" for the envelope's `app{}` block).

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
