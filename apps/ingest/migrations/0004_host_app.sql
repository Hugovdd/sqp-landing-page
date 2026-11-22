-- Host app the event came from: 'ae' | 'premiere'. Additive and nullable:
-- every existing row and every old client without app.hostApp stays NULL,
-- and readers treat NULL as After Effects. installs.hostApp is latest-seen
-- (like os); daily_active keeps its (installId, day) key, so the first host
-- seen that day wins. aeVersion keeps its name and carries the host version.
ALTER TABLE installs ADD COLUMN hostApp TEXT;
ALTER TABLE daily_active ADD COLUMN hostApp TEXT;
ALTER TABLE usage_events ADD COLUMN hostApp TEXT;
ALTER TABLE errors ADD COLUMN hostApp TEXT;
