-- Canonical D1 schema for the telemetry store (decision 3: D1 single-store).
-- apps/ingest applies this as its first migration. Times are epoch milliseconds.
-- See CONTEXT.md for installId / Install / Day / Session / Latest-seen semantics.

-- Identity spine. One row per install ever; never pruned.
-- firstSeen   = first time we received ANY event from this install (active base).
-- installedAt = set only on a real app_installed event (NULL for the
--               pre-telemetry back-catalogue) — drives "new installs/day".
-- os/appVersion/country are LATEST-SEEN (refreshed by the daily session heartbeat).
CREATE TABLE IF NOT EXISTS installs (
  installId   TEXT PRIMARY KEY,
  firstSeen   INTEGER NOT NULL,
  installedAt INTEGER,
  lastSeen    INTEGER NOT NULL,
  brand       TEXT NOT NULL,
  os          TEXT,
  appVersion  TEXT,
  country     TEXT
);
CREATE INDEX IF NOT EXISTS idx_installs_installedAt ON installs (installedAt);
CREATE INDEX IF NOT EXISTS idx_installs_brand ON installs (brand);

-- Active-user heartbeat: one row per (install, UTC day). Powers exact DAU/MAU.
CREATE TABLE IF NOT EXISTS daily_active (
  installId TEXT NOT NULL,
  day       TEXT NOT NULL,            -- 'YYYY-MM-DD' (UTC of receivedAt)
  brand     TEXT NOT NULL,
  PRIMARY KEY (installId, day)
);
CREATE INDEX IF NOT EXISTS idx_daily_active_day ON daily_active (day);
CREATE INDEX IF NOT EXISTS idx_daily_active_brand_day ON daily_active (brand, day);

-- High-volume additive events (fetch + duplication_run + captured-unknown).
-- Append-only; pruned ~18 months. event-specific columns are NULL when N/A.
CREATE TABLE IF NOT EXISTS usage_events (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  receivedAt       INTEGER NOT NULL,
  brand            TEXT NOT NULL,
  event            TEXT NOT NULL,
  installId        TEXT NOT NULL,
  os               TEXT,
  appVersion       TEXT,
  country          TEXT,
  indexedItemCount INTEGER,           -- fetch
  compsDuplicated  INTEGER,           -- duplication_run
  mode             TEXT               -- duplication_run: 'current' | 'all'
);
CREATE INDEX IF NOT EXISTS idx_usage_brand_time ON usage_events (brand, receivedAt);
CREATE INDEX IF NOT EXISTS idx_usage_event ON usage_events (event, receivedAt);

-- Individual crashes to triage. Stacks are SCRUBBED before insert. Pruned ~90d.
CREATE TABLE IF NOT EXISTS errors (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  installId  TEXT NOT NULL,
  receivedAt INTEGER NOT NULL,
  brand      TEXT NOT NULL,
  appVersion TEXT,
  aeVersion  TEXT,
  os         TEXT,
  country    TEXT,
  category   TEXT,
  name       TEXT NOT NULL,
  message    TEXT NOT NULL,
  stack      TEXT,
  action     TEXT
);
CREATE INDEX IF NOT EXISTS idx_errors_group ON errors (name, message);
CREATE INDEX IF NOT EXISTS idx_errors_time ON errors (receivedAt);
CREATE INDEX IF NOT EXISTS idx_errors_brand_time ON errors (brand, receivedAt);

-- Exact lifetime totals that survive pruning (decision 6). One row per brand.
CREATE TABLE IF NOT EXISTS counters (
  brand       TEXT PRIMARY KEY,
  comps_total INTEGER NOT NULL DEFAULT 0,
  runs_total  INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO counters (brand, comps_total, runs_total) VALUES ('ae', 0, 0);
INSERT OR IGNORE INTO counters (brand, comps_total, runs_total) VALUES ('binance', 0, 0);
