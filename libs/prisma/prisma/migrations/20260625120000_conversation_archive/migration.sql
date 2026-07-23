ALTER TABLE expert_conversations
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP(6),
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expert_conversations_archived_at
  ON expert_conversations (archived_at)
  WHERE archived_at IS NOT NULL;
