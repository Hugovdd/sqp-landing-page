-- Coarse license classification on the identity spine (latest-seen, like
-- os/appVersion). `licensePlan` ∈ trial|paid|none|unknown; `licenseType` is the
-- AESP licenseType code (SUL/SUB/EDU/…). Never the license key. NULL for the
-- pre-license back-catalogue and for installs whose AESP check hasn't resolved.
ALTER TABLE installs ADD COLUMN licensePlan TEXT;
ALTER TABLE installs ADD COLUMN licenseType TEXT;

-- Powers the dashboard license breakdown: group installs by plan, filtered by brand.
CREATE INDEX IF NOT EXISTS idx_installs_plan ON installs (brand, licensePlan);
