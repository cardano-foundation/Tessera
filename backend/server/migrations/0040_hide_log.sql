-- Moderation decisions, appended by the `hide` script and never rewritten. A
-- key's state is its latest row; `case_id` points to the legal team's record.
CREATE TABLE hide_log (
  seq     INTEGER PRIMARY KEY AUTOINCREMENT,
  kind    TEXT NOT NULL CHECK (kind IN ('survey', 'response', 'govAction')),
  key     TEXT NOT NULL,   -- "<txHex>:<index>" | "<txHex>:<responseIndex>" | "gov_action1…"
  action  TEXT NOT NULL CHECK (action IN ('hide', 'unhide')),
  case_id TEXT NOT NULL,
  at      INTEGER NOT NULL -- unix seconds
);
CREATE INDEX hide_log_key ON hide_log (kind, key, seq);

-- The hide state a refresh published, the only one serving reads, and the log
-- position it was read at.
ALTER TABLE snapshot_meta ADD COLUMN hidden TEXT NOT NULL
  DEFAULT '{"survey":[],"response":[],"govAction":[]}';
ALTER TABLE snapshot_meta ADD COLUMN hide_seq INTEGER NOT NULL DEFAULT 0;
