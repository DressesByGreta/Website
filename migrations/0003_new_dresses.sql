-- A dress shows as new (its tag and the shop's "new" filter) until this moment: two weeks after it is
-- first published, or after Greta marks it new again in the admin. NULL: never published yet.
ALTER TABLE products ADD COLUMN new_until TEXT;

-- The dresses already in the shop: those imported from older Instagram posts (they carry the post's
-- link) and any already published are not new; the ones Greta added herself stay unset, so they are
-- new for two weeks from when she publishes them, like every dress from now on.
UPDATE products SET new_until = created_at WHERE instagram_url != '' OR status = 'published';

-- The sales report reads orders by date.
CREATE INDEX orders_created ON orders (created_at);
