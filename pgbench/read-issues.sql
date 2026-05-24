\set engagement_offset random(1, 4000)

SELECT i.id, i.title, i.priority, i.due_date
FROM issues i
WHERE i.worker_engagement_id = (
  SELECT id FROM worker_engagements OFFSET :engagement_offset LIMIT 1
)
ORDER BY i.created_at DESC
LIMIT 50;