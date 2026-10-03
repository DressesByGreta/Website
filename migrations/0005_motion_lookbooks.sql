-- The dress in motion: one short silent video per dress (its Reel), shown as the dress page's second
-- photograph. JSON: {"id","ext":"mp4"|"webm","w","h","bytes","poster":{photo: key, ext, widths, w, h, lqip}}.
ALTER TABLE products ADD COLUMN video TEXT NOT NULL DEFAULT '';

-- Lookbooks: editorial pages made of photographs ("frames"), each with numbered marks on the
-- dresses it shows. A mark is {"x":0.42,"y":0.31,"product":"<id>"}, x and y as fractions of the photo.
CREATE TABLE lookbooks (
  id         TEXT PRIMARY KEY,
  slug       TEXT NOT NULL UNIQUE,
  title_sq   TEXT NOT NULL,
  title_en   TEXT NOT NULL DEFAULT '',
  intro_sq   TEXT NOT NULL DEFAULT '',
  intro_en   TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  sort       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE lookbook_frames (
  id          TEXT PRIMARY KEY,
  lookbook_id TEXT NOT NULL REFERENCES lookbooks (id) ON DELETE CASCADE,
  sort        INTEGER NOT NULL DEFAULT 0,
  key         TEXT NOT NULL,
  ext         TEXT NOT NULL DEFAULT 'webp' CHECK (ext IN ('webp', 'jpg')),
  widths      TEXT NOT NULL,
  w           INTEGER NOT NULL,
  h           INTEGER NOT NULL,
  lqip        TEXT NOT NULL DEFAULT '',
  caption_sq  TEXT NOT NULL DEFAULT '',
  caption_en  TEXT NOT NULL DEFAULT '',
  spots       TEXT NOT NULL DEFAULT '[]'
);
CREATE INDEX lookbook_frames_order ON lookbook_frames (lookbook_id, sort);
