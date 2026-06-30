-- Dev-only sample data for a LOCAL D1 (never run against remote).
-- Generates a realistic spread across brands / OS / versions / countries / days
-- so the dashboard has something to render. Apply after 0001_init.sql.

-- 60 installs; ~1/7 are pre-telemetry (installedAt NULL).
WITH RECURSIVE seq(i) AS (SELECT 0 UNION ALL SELECT i + 1 FROM seq WHERE i < 59)
INSERT INTO installs (installId, firstSeen, installedAt, lastSeen, brand, os, appVersion, country)
SELECT
  'inst-' || i,
  (unixepoch('now') - (60 - (i % 60)) * 86400) * 1000,
  CASE WHEN i % 7 = 0 THEN NULL ELSE (unixepoch('now') - (60 - (i % 60)) * 86400) * 1000 END,
  (unixepoch('now') - (i % 5) * 86400) * 1000,
  CASE WHEN i % 3 = 0 THEN 'binance' ELSE 'ae' END,
  CASE i % 4 WHEN 0 THEN 'macOS 14' WHEN 1 THEN 'macOS 15' WHEN 2 THEN 'Windows 11' ELSE 'Windows 10' END,
  CASE i % 4 WHEN 0 THEN '1.1.2' WHEN 1 THEN '1.1.1' WHEN 2 THEN '1.1.0' ELSE '1.0.0' END,
  CASE i % 8 WHEN 0 THEN 'US' WHEN 1 THEN 'GB' WHEN 2 THEN 'DE' WHEN 3 THEN 'IN'
            WHEN 4 THEN 'BR' WHEN 5 THEN 'JP' WHEN 6 THEN 'CA' ELSE 'FR' END
FROM seq;

-- Daily active rows over the last 30 days (sparse).
WITH RECURSIVE inst(i) AS (SELECT 0 UNION ALL SELECT i + 1 FROM inst WHERE i < 59),
     days(d) AS (SELECT 0 UNION ALL SELECT d + 1 FROM days WHERE d < 29)
INSERT OR IGNORE INTO daily_active (installId, day, brand)
SELECT 'inst-' || i,
       date(unixepoch('now') - d * 86400, 'unixepoch'),
       CASE WHEN i % 3 = 0 THEN 'binance' ELSE 'ae' END
FROM inst JOIN days
WHERE (i + d) % 3 = 0;

-- 300 usage events (fetch + duplication_run) over the last 30 days.
WITH RECURSIVE seq(i) AS (SELECT 0 UNION ALL SELECT i + 1 FROM seq WHERE i < 299)
INSERT INTO usage_events (receivedAt, brand, event, installId, os, appVersion, country, indexedItemCount, compsDuplicated, mode)
SELECT
  (unixepoch('now') - (i % 30) * 86400 - (i % 24) * 3600) * 1000,
  CASE WHEN i % 3 = 0 THEN 'binance' ELSE 'ae' END,
  CASE WHEN i % 2 = 0 THEN 'fetch' ELSE 'duplication_run' END,
  'inst-' || (i % 60),
  CASE i % 4 WHEN 0 THEN 'macOS 14' WHEN 1 THEN 'macOS 15' WHEN 2 THEN 'Windows 11' ELSE 'Windows 10' END,
  '1.1.1',
  CASE i % 4 WHEN 0 THEN 'US' WHEN 1 THEN 'GB' WHEN 2 THEN 'DE' ELSE 'IN' END,
  CASE WHEN i % 2 = 0 THEN (i % 50) + 1 ELSE NULL END,
  CASE WHEN i % 2 = 1 THEN (i % 8) + 1 ELSE NULL END,
  CASE WHEN i % 2 = 1 THEN (CASE WHEN i % 4 = 1 THEN 'current' ELSE 'all' END) ELSE NULL END
FROM seq;

-- Lifetime counters derived from the seeded duplication runs.
UPDATE counters SET
  comps_total = COALESCE((SELECT sum(compsDuplicated) FROM usage_events WHERE event = 'duplication_run' AND brand = counters.brand), 0),
  runs_total  = COALESCE((SELECT count(*) FROM usage_events WHERE event = 'duplication_run' AND brand = counters.brand), 0);

-- ── Altar (brand 'altar') ────────────────────────────────────────────────────
-- A separate product whose dashboard surface is Forge tool usage. Without these
-- rows the Forge page is empty locally for everyone.

-- 15 Altar installs.
WITH RECURSIVE seq(i) AS (SELECT 0 UNION ALL SELECT i + 1 FROM seq WHERE i < 14)
INSERT INTO installs (installId, firstSeen, installedAt, lastSeen, brand, os, appVersion, country)
SELECT
  'altar-inst-' || i,
  (unixepoch('now') - (40 - i) * 86400) * 1000,
  (unixepoch('now') - (40 - i) * 86400) * 1000,
  (unixepoch('now') - (i % 5) * 86400) * 1000,
  'altar',
  CASE i % 3 WHEN 0 THEN 'macOS 15' WHEN 1 THEN 'macOS 14' ELSE 'Windows 11' END,
  CASE i % 3 WHEN 0 THEN '0.9.0' WHEN 1 THEN '0.8.1' ELSE '0.8.0' END,
  CASE i % 6 WHEN 0 THEN 'US' WHEN 1 THEN 'GB' WHEN 2 THEN 'DE' WHEN 3 THEN 'NL' WHEN 4 THEN 'FR' ELSE 'CA' END
FROM seq;

-- Altar daily active (sparse, last 30 days).
WITH RECURSIVE inst(i) AS (SELECT 0 UNION ALL SELECT i + 1 FROM inst WHERE i < 14),
     days(d) AS (SELECT 0 UNION ALL SELECT d + 1 FROM days WHERE d < 29)
INSERT OR IGNORE INTO daily_active (installId, day, brand)
SELECT 'altar-inst-' || i,
       date(unixepoch('now') - d * 86400, 'unixepoch'),
       'altar'
FROM inst JOIN days
WHERE (i + d) % 4 = 0;

-- 180 Forge tool_used events. Tool popularity is uneven (`i % 11` → weighted
-- buckets) and the install (`i % 15`, coprime to 11) is decoupled from the tool,
-- so per-tool *reach* (distinct installs) genuinely varies — broad-adoption vs
-- heavy-use-by-few — instead of every tool landing on the same install subset.
WITH RECURSIVE seq(i) AS (SELECT 0 UNION ALL SELECT i + 1 FROM seq WHERE i < 179)
INSERT INTO usage_events (receivedAt, brand, event, installId, os, appVersion, country, pane, tool, action)
SELECT
  (unixepoch('now') - (i % 30) * 86400 - (i % 12) * 3600) * 1000,
  'altar',
  'tool_used',
  -- Confine rarer tools to fewer installs so per-tool reach forms a gradient
  -- (pin broad across all 15, stroke narrow across 2) rather than saturating.
  'altar-inst-' || (i % (CASE
    WHEN i % 11 < 4 THEN 15
    WHEN i % 11 < 7 THEN 12
    WHEN i % 11 < 9 THEN 8
    WHEN i % 11 < 10 THEN 4
    ELSE 2 END)),
  CASE i % 3 WHEN 0 THEN 'macOS 15' WHEN 1 THEN 'macOS 14' ELSE 'Windows 11' END,
  '0.9.0',
  CASE i % 6 WHEN 0 THEN 'US' WHEN 1 THEN 'GB' WHEN 2 THEN 'DE' WHEN 3 THEN 'NL' WHEN 4 THEN 'FR' ELSE 'CA' END,
  'forge',
  CASE
    WHEN i % 11 < 4 THEN 'pin'        -- most popular
    WHEN i % 11 < 7 THEN 'resize'
    WHEN i % 11 < 9 THEN 'align'
    WHEN i % 11 < 10 THEN 'distribute'
    ELSE 'stroke'                     -- rare, narrow reach
  END,
  CASE
    WHEN i % 11 < 4 THEN (CASE i % 3 WHEN 0 THEN 'top-left' WHEN 1 THEN 'center' ELSE 'bottom-right' END)
    WHEN i % 11 < 7 THEN (CASE i % 2 WHEN 0 THEN 'width' ELSE 'height' END)
    WHEN i % 11 < 9 THEN (CASE i % 2 WHEN 0 THEN 'horizontal' ELSE 'vertical' END)
    WHEN i % 11 < 10 THEN 'even'
    ELSE 'outline'
  END
FROM seq;

-- 40 errors forming 4 groups (name+message), with scrubbed stacks.
WITH RECURSIVE seq(i) AS (SELECT 0 UNION ALL SELECT i + 1 FROM seq WHERE i < 39)
INSERT INTO errors (installId, receivedAt, brand, appVersion, aeVersion, os, country, category, name, message, stack, action)
SELECT
  'inst-' || (i % 60),
  (unixepoch('now') - (i % 20) * 86400) * 1000,
  CASE WHEN i % 3 = 0 THEN 'binance' ELSE 'ae' END,
  '1.1.1',
  CASE WHEN i % 3 = 0 THEN NULL ELSE '24.0' END,
  CASE i % 3 WHEN 0 THEN 'Windows 11' ELSE 'macOS 15' END,
  CASE i % 3 WHEN 0 THEN 'US' WHEN 1 THEN 'GB' ELSE 'DE' END,
  CASE i % 3 WHEN 0 THEN 'react' WHEN 1 THEN 'extendscript' ELSE 'unhandled' END,
  CASE i % 4 WHEN 0 THEN 'TypeError' WHEN 1 THEN 'RangeError' WHEN 2 THEN 'ReferenceError' ELSE 'Error' END,
  CASE i % 4 WHEN 0 THEN 'Cannot read property of undefined' WHEN 1 THEN 'Index out of bounds'
             WHEN 2 THEN 'comp is not defined' ELSE 'Unexpected failure' END,
  'at duplicateComps (~/main.jsx:' || (i % 99) || ')',
  CASE i % 2 WHEN 0 THEN 'duplicate' ELSE 'fetch' END
FROM seq;
