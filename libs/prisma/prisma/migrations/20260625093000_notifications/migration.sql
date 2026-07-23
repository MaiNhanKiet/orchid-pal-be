-- Notifications for consultation and system events
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP(6) DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON notifications (user_id, is_read, created_at DESC);
