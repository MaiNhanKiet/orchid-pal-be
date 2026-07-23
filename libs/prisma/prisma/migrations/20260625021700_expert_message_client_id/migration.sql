ALTER TABLE expert_messages
  ADD COLUMN IF NOT EXISTS client_message_id VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS uq_expert_messages_client_id
  ON expert_messages (conversation_id, client_message_id)
  WHERE client_message_id IS NOT NULL;
