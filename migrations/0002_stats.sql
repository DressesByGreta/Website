-- Visit counts kept by the shop itself (src/worker/stats.ts): no cookies, no IP addresses, no
-- identifiers. One row per day (Tirana time), metric and key; the admin's Statistikat page reads them.
CREATE TABLE stats (
  day    TEXT NOT NULL,
  metric TEXT NOT NULL,
  key    TEXT NOT NULL DEFAULT '',
  n      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, metric, key)
);

-- Where the visit that ended in this order came from: instagram, google, direct, or a utm_source
-- with its campaign (instagram/story-tetor). Sent by the checkout from the visit's first page.
ALTER TABLE orders ADD COLUMN source TEXT NOT NULL DEFAULT '';
