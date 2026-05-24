\set org_offset random(1, 1000)

SELECT i.*
FROM issues i
JOIN worker_engagements we
  ON we.id = i.worker_engagement_id
WHERE we.organization_id = (
    SELECT id FROM organizations OFFSET :org_offset LIMIT 1
)
ORDER BY i.created_at DESC;