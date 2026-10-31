\set issue_offset random(1, 40000)
\set actor_offset random(1, 500)

INSERT INTO issue_audit_logs (
  id, issue_id, actor_user_id, action, old_value, new_value, created_at
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM issues OFFSET :issue_offset LIMIT 1),
  (SELECT id FROM users OFFSET :actor_offset LIMIT 1),
  'priority_changed',
  '{"value": "low"}'::jsonb,
  '{"value": "high"}'::jsonb,
  now()
);