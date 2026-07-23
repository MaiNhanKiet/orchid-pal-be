-- Allow consultation booking workflow statuses used by expert-consultation module
ALTER TABLE expert_conversations
  DROP CONSTRAINT IF EXISTS expert_conversations_status_check;

ALTER TABLE expert_conversations
  ADD CONSTRAINT expert_conversations_status_check
  CHECK (
    status::text = ANY (
      ARRAY[
        'PENDING',
        'OPEN',
        'IN_PROGRESS',
        'CLOSED',
        'RESOLVED'
      ]::text[]
    )
  );
