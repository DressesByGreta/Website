-- What customers said, in their own words, with their permission: a quote, a first name and a city,
-- optionally their photograph in the dress. Greta adds them in the dress's page in the admin; the
-- dress page and the home page show them. No stars: they are chosen words, not a rating.
CREATE TABLE reviews (
  id          TEXT PRIMARY KEY,
  product_id  TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  city        TEXT NOT NULL DEFAULT '',
  text        TEXT NOT NULL,
  lang        TEXT NOT NULL DEFAULT 'sq' CHECK (lang IN ('sq', 'en', 'fr')),
  photo       TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX reviews_product ON reviews (product_id, created_at);
