-- Requests from the shop's visitors that Greta answers herself: a dress for a date (rental), or a
-- word when a sold-out size is back (restock). Rentals she confirms become the dress's booked dates.
CREATE TABLE requests (
  id          TEXT PRIMARY KEY,
  kind        TEXT NOT NULL CHECK (kind IN ('rental', 'restock')),
  product_id  TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  size        TEXT NOT NULL CHECK (size IN ('34', '36', '38', '40', '42')),
  event_date  TEXT,                                                    -- rental: YYYY-MM-DD
  name        TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL,
  note        TEXT NOT NULL DEFAULT '',
  lang        TEXT NOT NULL DEFAULT 'sq',
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'declined', 'done')),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX requests_kind_status ON requests (kind, status, created_at);
CREATE INDEX requests_product ON requests (product_id, kind, status);

-- How a dress fits: measurements in centimetres ({"length":150,"sizes":{"36":{"bust":84,"waist":66,"hips":92}}})
-- and a short note in each language ("fits small, take one size up").
ALTER TABLE products ADD COLUMN measures TEXT NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN fit_sq TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN fit_en TEXT NOT NULL DEFAULT '';
