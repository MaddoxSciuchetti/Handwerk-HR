\set worker_offset random(1, 15000)

WITH picked_worker AS (
  SELECT w.id, w.organization_id
  FROM workers w
  OFFSET :worker_offset
  LIMIT 1
)
SELECT
    w.*,
    wd.id AS doc_id,
    wd.name AS doc_name,
    wd.file_url,
    we.id AS eng_id,
    i.id AS issue_id,
    i.title
FROM workers w
LEFT JOIN worker_documents wd ON wd.worker_id = w.id
LEFT JOIN worker_engagements we ON we.worker_id = w.id
LEFT JOIN issues i ON i.worker_engagement_id = we.id
WHERE w.id = (SELECT id FROM picked_worker)
  AND w.organization_id = (SELECT organization_id FROM picked_worker);