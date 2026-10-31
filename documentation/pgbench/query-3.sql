\set org_offset random(1, 1000)

SELECT
    w.id,
    w.first_name,
    w.last_name,
    w.email,
    w.status,
    w.organization_id,
    w.created_at,
    we.id AS engagement_id,
    we.start_date,
    we.end_date,
    we.type,
    es.name AS engagement_status_name,
    ru.first_name AS responsible_first_name,
    ru.last_name AS responsible_last_name,
    ru.email AS responsible_email,
    cb.first_name AS created_by_first_name,
    cb.last_name AS created_by_last_name,
    cb.email AS created_by_email
FROM workers w
LEFT JOIN LATERAL (
    SELECT we_inner.*
    FROM worker_engagements we_inner
    WHERE we_inner.worker_id = w.id
    ORDER BY we_inner.start_date DESC NULLS LAST
    LIMIT 1
) we ON true
LEFT JOIN engagement_statuses es ON es.id = we.status_id
LEFT JOIN users ru ON ru.id = we.responsible_user_id
LEFT JOIN users cb ON cb.id = w.created_by_user_id
WHERE w.organization_id = (
    SELECT id FROM organizations OFFSET :org_offset LIMIT 1
)
ORDER BY w.created_at DESC;