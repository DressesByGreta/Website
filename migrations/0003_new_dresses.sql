-- A dress shows as new (its tag and the shop's "new" filter) until this moment: two weeks after it is
-- first published, or after Greta marks it new again in the admin. NULL: never published yet.
ALTER TABLE products ADD COLUMN new_until TEXT;

-- The dresses already in the shop, all from older Instagram posts, are not new when they go live.
UPDATE products SET new_until = created_at;

-- The sales report reads orders by date.
CREATE INDEX orders_created ON orders (created_at);
