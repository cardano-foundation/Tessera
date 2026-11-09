-- Content this website stops showing once a report is judged unlawful. Each
-- row is one decision, appended by the `hide` script and never rewritten: a
-- key's state is its latest row. The reason and the reporter stay in the
-- legal team's case system; `case_id` is the pointer to them.
CREATE TABLE hide_log (
  seq     INTEGER PRIMARY KEY AUTOINCREMENT,
  kind    TEXT NOT NULL CHECK (kind IN ('survey', 'response', 'govAction')),
  key     TEXT NOT NULL,   -- "<txHex>:<index>" | "<txHex>:<responseIndex>" | "gov_action1…"
  action  TEXT NOT NULL CHECK (action IN ('hide', 'unhide')),
  case_id TEXT NOT NULL,
  at      INTEGER NOT NULL -- unix seconds
);
CREATE INDEX hide_log_key ON hide_log (kind, key, seq);

-- The hide state a refresh published, with the snapshot it versions: serving
-- reads only this, so a decision takes effect with the next `fetched_at`, and
-- the ETags and the change selection move with it. `hide_seq` is the log
-- position it was read at; a refresh that finds the log still there reads
-- nothing else.
ALTER TABLE snapshot_meta ADD COLUMN hidden TEXT NOT NULL
  DEFAULT '{"survey":[],"response":[],"govAction":[]}';
ALTER TABLE snapshot_meta ADD COLUMN hide_seq INTEGER NOT NULL DEFAULT 0;
