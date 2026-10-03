-- When a request was closed (answered, notified or declined): waiting-list requests are deleted a
-- month after that (requests.ts purgeRequests, as the privacy page says).
ALTER TABLE requests ADD COLUMN closed_at TEXT;
