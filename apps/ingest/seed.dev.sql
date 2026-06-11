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
