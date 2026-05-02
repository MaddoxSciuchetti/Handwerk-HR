/*
================================================================================
Approximate SQL derived from server/src services + middleware.
Prisma may merge/split statements; this is for reading/planning — not log dumps.
Table names follow prisma @@map (e.g. users, workers, worker_engagements).
================================================================================
*/


-- =============================================================================
-- AUTH MIDDLEWARE — active org for user (runs on most authenticated requests)
-- SOURCE: server/src/middleware/authenticate.ts
-- LABEL: Pick first active membership org for JWT userId
-- =============================================================================
SELECT om.organization_id
FROM organization_members om
WHERE om.user_id = :user_id
  AND om.status = 'active'
ORDER BY om.joined_at ASC NULLS LAST
LIMIT 1;


-- =============================================================================
-- WORKER GUARD — ownership check (runs before many worker routes)
-- SOURCE: server/src/services/worker.serviceV2.ts → assertOwnership()
-- LABEL: Worker belongs to org?
-- =============================================================================
SELECT w.id
FROM workers w
WHERE w.id = :worker_id
  AND w.organization_id = :organization_id;


-- =============================================================================
-- WORKER LIST — lifecycle table (GET /worker)
-- SOURCE: worker.serviceV2.getWorkerData()
-- LABEL: Workers + latest engagement + engagement status + responsible user + createdBy
-- NOTE: Code reads page/limit but findMany omits skip/take unless changed.
-- =============================================================================
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
    es.id AS engagement_status_id,
    es.name AS engagement_status_name,
    ru.id AS responsible_user_id,
    ru.first_name AS responsible_first_name,
    ru.last_name AS responsible_last_name,
    ru.email AS responsible_email,
    cb.id AS created_by_id,
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
WHERE w.organization_id = :organization_id
ORDER BY w.created_at DESC;


-- =============================================================================
-- ALL ISSUES FOR ORG — task board
-- SOURCE: tasks.service.ts → queryTasks()
-- LABEL: Every issue whose engagement is in this org (no LIMIT in service)
-- =============================================================================
SELECT i.*
FROM issues i
INNER JOIN worker_engagements we ON we.id = i.worker_engagement_id
WHERE we.organization_id = :organization_id
ORDER BY i.created_at DESC;


-- =============================================================================
-- EMPLOYEE OVERVIEW — engagements × nested graph (very wide read)
-- SOURCE: employee.serviceV2.ts → queryEmployeeWorkerData()
-- LABEL: All org engagements with worker, status, responsible user, issues
-- NOTE: Prisma may batch; service also loads latest audit row per issue + actor.
-- =============================================================================
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
    es.id AS engagement_status_id,
    es.name AS engagement_status_name,
    ru.id AS responsible_id,
    ru.first_name AS responsible_first_name,
    ru.last_name AS responsible_last_name,
    i.id AS issue_id,
    i.title AS issue_title,
    i.priority,
    ist.id AS issue_status_id,
    ist.name AS issue_status_name,
    a.id AS assignee_id,
    a.first_name AS assignee_first_name,
    a.last_name AS assignee_last_name
FROM worker_engagements we
JOIN workers w ON w.id = we.worker_id
LEFT JOIN engagement_statuses es ON es.id = we.status_id
LEFT JOIN users ru ON ru.id = we.responsible_user_id
LEFT JOIN issues i ON i.worker_engagement_id = we.id
LEFT JOIN issue_statuses ist ON ist.id = i.status_id
LEFT JOIN users a ON a.id = i.assignee_user_id
WHERE we.organization_id = :organization_id
ORDER BY we.created_at ASC, i.created_at DESC;


-- =============================================================================
-- ORG USER DIRECTORY
-- SOURCE: employee.serviceV2.ts → queryEmployee()
-- LABEL: Users who are members (nested selects add absences / substitute)
-- =============================================================================
SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.avatar_url,
    om.membership_role
FROM users u
JOIN organization_members om ON om.user_id = u.id AND om.organization_id = :organization_id
ORDER BY u.last_name ASC, u.first_name ASC;


-- =============================================================================
-- ENGAGEMENT PICKER
-- SOURCE: orgEngagement.service.ts → listOrgEngagements()
-- =============================================================================
SELECT
    we.id,
    we.type,
    w.id AS worker_id,
    w.first_name,
    w.last_name
FROM worker_engagements we
JOIN workers w ON w.id = we.worker_id
WHERE we.organization_id = :organization_id
ORDER BY we.created_at ASC;


-- =============================================================================
-- ISSUE TEMPLATES + ITEM COUNT
-- SOURCE: template.serviceV2.ts → queryTemplates()
-- =============================================================================
SELECT
    it.id,
    it.template_name,
    it.template_description,
    it.is_active,
    it.created_at,
    it.updated_at,
    COUNT(ti.id)::bigint AS items_count
FROM issue_templates it
LEFT JOIN template_items ti ON ti.issue_template_id = it.id
WHERE it.organization_id = :organization_id
GROUP BY it.id
ORDER BY it.created_at DESC;


-- =============================================================================
-- ENGAGEMENT STATUSES + USAGE COUNT
-- SOURCE: organizationStatus.service.ts (entityType = engagement)
-- =============================================================================
SELECT
    es.*,
    (SELECT COUNT(*)::int FROM worker_engagements e WHERE e.status_id = es.id) AS engagements_using_status
FROM engagement_statuses es
WHERE es.organization_id = :organization_id
ORDER BY es.order_index ASC;


-- =============================================================================
-- ISSUE STATUSES + USAGE COUNT
-- SOURCE: organizationStatus.service.ts (entityType = issue)
-- =============================================================================
SELECT
    ist.*,
    (SELECT COUNT(*)::int FROM issues i WHERE i.status_id = ist.id) AS issues_using_status
FROM issue_statuses ist
WHERE ist.organization_id = :organization_id
ORDER BY ist.order_index ASC;


-- =============================================================================
-- SINGLE WORKER DETAIL — deep graph (GET worker by id)
-- SOURCE: worker.serviceV2.ts → getWorkerById()
-- NOTE: Flattened illustration; Prisma returns nested JSON. Then N× S3 presign.
-- =============================================================================
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
WHERE w.id = :worker_id AND w.organization_id = :organization_id;


-- =============================================================================
-- WORKER HISTORY (two queries in code via Promise.all)
-- SOURCE: worker.serviceV2.ts → getWorkerHistory()
-- =============================================================================
SELECT we.*
FROM worker_engagements we
WHERE we.worker_id = :worker_id
ORDER BY we.start_date DESC;

SELECT *
FROM worker_documents
WHERE worker_id = :worker_id
ORDER BY created_at DESC;


-- =============================================================================
-- WORKER DOCUMENTS LIST (+ presign each row in app)
-- SOURCE: worker.serviceV2.ts → listWorkerDocuments()
-- =============================================================================
SELECT *
FROM worker_documents
WHERE worker_id = :worker_id
ORDER BY created_at DESC;


-- =============================================================================
-- TASK / ISSUE AUDIT TIMELINE + BATCH LOOKUPS
-- SOURCE: tasks.service.ts → getTaskHistoryInOrg()
-- =============================================================================
SELECT ial.*
FROM issue_audit_logs ial
WHERE ial.issue_id = :issue_id
ORDER BY ial.created_at DESC;

SELECT id, name FROM issue_statuses WHERE id = ANY (:status_ids);

SELECT id, first_name, last_name, email FROM users WHERE id = ANY (:user_ids);


-- =============================================================================
-- CREATE WORKER — default engagement status + transaction
-- SOURCE: worker.serviceV2.ts → createWorker()
-- =============================================================================
SELECT id FROM engagement_statuses
WHERE organization_id = :organization_id AND is_default = true
LIMIT 1;

BEGIN;
INSERT INTO workers (id, organization_id, created_by_user_id, first_name, last_name, email, status)
VALUES (:id, :organization_id, :created_by_user_id, :first_name, :last_name, :email, 'active');
INSERT INTO worker_engagements (id, worker_id, organization_id, responsible_user_id, status_id, type)
VALUES (:eng_id, :worker_id, :organization_id, :responsible_user_id, :status_id, 'onboarding');
COMMIT;


-- =============================================================================
-- APPLY ISSUE TEMPLATE — burst inserts in transaction
-- SOURCE: worker.serviceV2.ts → applyIssueTemplateInTx()
-- =============================================================================
SELECT * FROM issue_statuses
WHERE organization_id = :organization_id
ORDER BY order_index ASC;

BEGIN;
INSERT INTO issues (id, worker_engagement_id, created_by_user_id, status_id, title, description, priority, template_item_id)
VALUES (...);
INSERT INTO issue_audit_logs (id, issue_id, actor_user_id, action, new_value)
VALUES (...);
COMMIT;


-- =============================================================================
-- DELETE WORKER
-- SOURCE: worker.serviceV2.ts → deleteWorker()
-- =============================================================================
BEGIN;
DELETE FROM worker_documents WHERE worker_id = :worker_id;
DELETE FROM worker_engagements WHERE worker_id = :worker_id;
DELETE FROM workers WHERE id = :worker_id;
COMMIT;


-- =============================================================================
-- AUTH — representative reads (login / refresh / verify)
-- SOURCE: auth.serviceV2.ts
-- =============================================================================
SELECT * FROM users WHERE email = :email LIMIT 1;

SELECT * FROM refresh_tokens WHERE id = :token_record_id LIMIT 1;

UPDATE refresh_tokens SET revoked_at = NOW(), updated_at = NOW() WHERE id = :id;

SELECT * FROM new_verification_codes WHERE id = :code_id;

UPDATE users SET is_verified = true, updated_at = NOW() WHERE id = :user_id;
