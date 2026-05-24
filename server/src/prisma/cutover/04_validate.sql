-- =============================================================================
-- 04_validate.sql
-- Post-ETL validation. Compare output against 00_preflight_snapshot baseline.
-- All checks should pass before production cutover.
-- =============================================================================

\echo '=== 1. Row counts ==='
SELECT 'users' AS tbl, COUNT(*)::bigint AS cnt FROM users
UNION ALL SELECT 'workers', COUNT(*)::bigint FROM workers
UNION ALL SELECT 'organizations', COUNT(*)::bigint FROM organizations
UNION ALL SELECT 'organization_members', COUNT(*)::bigint FROM organization_members
UNION ALL SELECT 'subscriptions', COUNT(*)::bigint FROM subscriptions
UNION ALL SELECT 'worker_engagements', COUNT(*)::bigint FROM worker_engagements
UNION ALL SELECT 'issues', COUNT(*)::bigint FROM issues
UNION ALL SELECT 'issue_templates', COUNT(*)::bigint FROM issue_templates
UNION ALL SELECT 'template_items', COUNT(*)::bigint FROM template_items
UNION ALL SELECT 'issue_audit_logs', COUNT(*)::bigint FROM issue_audit_logs
UNION ALL SELECT 'comments', COUNT(*)::bigint FROM comments
ORDER BY tbl;

\echo '=== 2. Expected counts (5 users, 2 workers, 2 engagements, 28 issues, 20 audit, ~12 comments) ==='
SELECT
    (SELECT COUNT(*) FROM users) = 5 AS users_ok,
    (SELECT COUNT(*) FROM workers) = 2 AS workers_ok,
    (SELECT COUNT(*) FROM worker_engagements) = 2 AS engagements_ok,
    (SELECT COUNT(*) FROM issues) = 28 AS issues_ok,
    (SELECT COUNT(*) FROM issue_audit_logs) >= 20 AS audit_ok,
    (SELECT COUNT(*) FROM issue_templates) = 2 AS templates_ok,
    (SELECT COUNT(*) FROM template_items) = 28 AS template_items_ok;

\echo '=== 3. Organization ==='
SELECT id, name, slug, created_by_user_id FROM organizations;

\echo '=== 4. Engagement status snapshot ==='
SELECT w.first_name, w.last_name, we.type, we.status,
       COUNT(i.id)::bigint AS tasks,
       COUNT(*) FILTER (WHERE i.status = 'done')::bigint AS done,
       COUNT(*) FILTER (WHERE i.status = 'in_progress')::bigint AS in_progress,
       COUNT(*) FILTER (WHERE i.status = 'open')::bigint AS open
FROM workers w
JOIN worker_engagements we ON we.worker_id = w.id
LEFT JOIN issues i ON i.worker_engagement_id = we.id
GROUP BY w.first_name, w.last_name, we.type, we.status
ORDER BY w.last_name;

\echo '=== 5. Template item counts ==='
SELECT it.template_name, COUNT(ti.id)::bigint AS items
FROM issue_templates it
JOIN template_items ti ON ti.issue_template_id = it.id
GROUP BY it.template_name
ORDER BY it.template_name;

\echo '=== 6. FK integrity (expect all zero) ==='
SELECT 'orphan_issues_engagement' AS check_name, COUNT(*)::bigint AS cnt
FROM issues i
LEFT JOIN worker_engagements we ON we.id = i.worker_engagement_id
WHERE we.id IS NULL
UNION ALL
SELECT 'orphan_audit_issue', COUNT(*)::bigint
FROM issue_audit_logs a
LEFT JOIN issues i ON i.id = a.issue_id
WHERE i.id IS NULL
UNION ALL
SELECT 'orphan_comments_issue', COUNT(*)::bigint
FROM comments c
LEFT JOIN issues i ON i.id = c.issue_id
WHERE i.id IS NULL
UNION ALL
SELECT 'orphan_workers_org', COUNT(*)::bigint
FROM workers w
LEFT JOIN organizations o ON o.id = w.organization_id
WHERE o.id IS NULL;

\echo '=== 7. Password hashes ==='
SELECT id, email,
       (password_hash LIKE '$2b$10$%') AS valid_bcrypt,
       (LENGTH(password_hash) = 60) AS valid_length
FROM users
ORDER BY email;

\echo '=== 8. History spot-check (comments with notes) ==='
SELECT i.title, c.body, c.created_at
FROM comments c
JOIN issues i ON i.id = c.issue_id
ORDER BY c.created_at
LIMIT 15;

\echo '=== 9. Prisma migrations applied ==='
SELECT COUNT(*)::bigint AS migration_count FROM _prisma_migrations;

\echo '=== 10. Overall pass/fail ==='
SELECT
    CASE
        WHEN (SELECT COUNT(*) FROM users) = 5
         AND (SELECT COUNT(*) FROM workers) = 2
         AND (SELECT COUNT(*) FROM worker_engagements) = 2
         AND (SELECT COUNT(*) FROM issues) = 28
         AND (SELECT COUNT(*) FROM issue_audit_logs) >= 20
         AND (SELECT COUNT(*) FROM template_items) = 28
         AND (SELECT COUNT(*) FROM issue_templates) = 2
         AND (SELECT slug FROM organizations LIMIT 1) = 'bsb-gruppe'
        THEN 'PASS'
        ELSE 'FAIL'
    END AS validation_result;
