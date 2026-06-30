-- tool_used events: which in-panel tool (and optional sub-action) was invoked.
-- Stored in usage_events alongside fetch/duplication_run; these columns are NULL
-- for every other event type. `pane` groups tools by panel surface (e.g.
-- 'rigging'); `tool` is the tool family; `action` is the optional sub-action
-- (a pin position, resize dimension, find/replace variant, …).
ALTER TABLE usage_events ADD COLUMN pane TEXT;
ALTER TABLE usage_events ADD COLUMN tool TEXT;
ALTER TABLE usage_events ADD COLUMN action TEXT;

-- Powers the dashboard "most-used tool" ranking: filter by event+pane, group by tool.
CREATE INDEX IF NOT EXISTS idx_usage_tool ON usage_events (pane, tool, receivedAt);
