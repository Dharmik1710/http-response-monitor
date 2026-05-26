-- Up Migration

CREATE TABLE IF NOT EXISTS ping_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interval_key TIMESTAMPTZ NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_payload JSONB NOT NULL,
  response_status INTEGER,
  response_body JSONB,
  response_body_truncated BOOLEAN NOT NULL DEFAULT false,
  latency_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_ping_responses_created_at
  ON ping_responses (created_at DESC);

-- Down Migration

DROP INDEX IF EXISTS idx_ping_responses_created_at;
DROP TABLE IF EXISTS ping_responses;
