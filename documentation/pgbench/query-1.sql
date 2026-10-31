\set org_offset random(1, 1000)

SELECT
    we.id AS engagement_id,
    we.type,
    we.start_date,
    we.end_date,
    we.organization_id,
    w.id AS worker_id,
    w.first_name AS worker_first_name,
    w.last_name AS worker_last_name,
    w.email AS worker_email,
    es.name AS engagement_status_name,
    ru.first_name AS responsible_first_name,
    ru.last_name AS responsible_last_name,
    i.id AS issue_id,
    i.title AS issue_title,
    i.priority,
    ist.name AS issue_status_name,
    a.first_name AS assignee_first_name,
    a.last_name AS assignee_last_name
FROM worker_engagements we
JOIN workers w ON w.id = we.worker_id
LEFT JOIN engagement_statuses es ON es.id = we.status_id
LEFT JOIN users ru ON ru.id = we.responsible_user_id
LEFT JOIN issues i ON i.worker_engagement_id = we.id
LEFT JOIN issue_statuses ist ON ist.id = i.status_id
LEFT JOIN users a ON a.id = i.assignee_user_id
WHERE we.organization_id = (
    SELECT id FROM organizations OFFSET :org_offset LIMIT 1
)
ORDER BY we.created_at ASC, i.created_at DESC;