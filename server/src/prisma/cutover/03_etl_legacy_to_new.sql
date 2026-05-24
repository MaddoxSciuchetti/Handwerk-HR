-- =============================================================================
-- 03_etl_legacy_to_new.sql
-- Migrate quarantined legacy data into the new schema (run AFTER 02_apply_target_schema).
-- Requires: _legacy_* tables from 01, empty new tables from Prisma migrations.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Constants
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _cutover_config (
    org_id              TEXT PRIMARY KEY,
    org_slug            TEXT NOT NULL,
    org_name            TEXT NOT NULL,
    admin_user_id       TEXT NOT NULL,
    onboarding_tpl_id   TEXT NOT NULL,
    offboarding_tpl_id  TEXT NOT NULL
);

INSERT INTO _cutover_config VALUES (
    gen_random_uuid()::text,
    'bsb-gruppe',
    'bsb-gruppe',
    'cmmoxksr7000i2vnsd3enikpz',
    gen_random_uuid()::text,
    gen_random_uuid()::text
);

-- ---------------------------------------------------------------------------
-- Mapping tables (persist through transaction for validation queries)
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _map_worker (
    legacy_id   INTEGER PRIMARY KEY,
    worker_id   TEXT NOT NULL
);

CREATE TEMP TABLE _map_form (
    legacy_id   INTEGER PRIMARY KEY,
    engagement_id TEXT NOT NULL
);

CREATE TEMP TABLE _map_form_field (
    legacy_id   INTEGER PRIMARY KEY,
    template_item_id TEXT NOT NULL
);

CREATE TEMP TABLE _map_form_input (
    legacy_id   INTEGER PRIMARY KEY,
    issue_id    TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- 1. Auth users
-- ---------------------------------------------------------------------------
INSERT INTO users (
    id, first_name, last_name, display_name, email, password_hash,
    is_verified, status, created_at, updated_at
)
SELECT
    u.id,
    u.vorname,
    u.nachname,
    NULLIF(TRIM(u.vorname || ' ' || u.nachname), ''),
    u.email::text,
    u.password,
    u.verified,
    'active'::"UserStatus",
    COALESCE(u."createdAt", NOW()),
    COALESCE(u."updatedAt", NOW())
FROM _legacy_user u;

-- ---------------------------------------------------------------------------
-- 2. Organization + membership + subscription
-- ---------------------------------------------------------------------------
INSERT INTO organizations (
    id, created_by_user_id, name, slug, status, created_at, updated_at
)
SELECT
    c.org_id,
    c.admin_user_id,
    c.org_name,
    c.org_slug,
    'active'::"OrganizationStatusEnum",
    NOW(),
    NOW()
FROM _cutover_config c;

INSERT INTO organization_members (
    id, user_id, organization_id, membership_role, status, joined_at, created_at, updated_at
)
SELECT
    gen_random_uuid()::text,
    u.id,
    c.org_id,
    CASE WHEN u.user_permission = 'CHEF' THEN 'admin'::"OrgMemberRole" ELSE 'worker'::"OrgMemberRole" END,
    'active'::"MemberStatus",
    COALESCE(u."createdAt", NOW()),
    COALESCE(u."createdAt", NOW()),
    COALESCE(u."updatedAt", NOW())
FROM _legacy_user u
CROSS JOIN _cutover_config c;

INSERT INTO subscriptions (
    id, organization_id, status, created_at, updated_at
)
SELECT
    gen_random_uuid()::text,
    c.org_id,
    'trialing'::"SubscriptionStatus",
    NOW(),
    NOW()
FROM _cutover_config c;

-- ---------------------------------------------------------------------------
-- 3. Workers
-- ---------------------------------------------------------------------------
INSERT INTO _map_worker (legacy_id, worker_id)
SELECT lw.id, gen_random_uuid()::text
FROM _legacy_workers lw;

INSERT INTO workers (
    id, organization_id, created_by_user_id,
    first_name, last_name, email, position, street,
    entry_date, exit_date, status, created_at, updated_at
)
SELECT
    m.worker_id,
    c.org_id,
    c.admin_user_id,
    lw.vorname,
    lw.nachname,
    lw.email::text,
    lw."position",
    lw.adresse,
    lw.eintrittsdatum,
    lw.austrittsdatum,
    CASE WHEN lw."archivedAt" IS NOT NULL THEN 'inactive'::"WorkerStatus" ELSE 'active'::"WorkerStatus" END,
    COALESCE(lw."createdAt", NOW()),
    COALESCE(lw."updatedAt", NOW())
FROM _legacy_workers lw
JOIN _map_worker m ON m.legacy_id = lw.id
CROSS JOIN _cutover_config c;

-- ---------------------------------------------------------------------------
-- 4. Issue templates (Onboarding / Offboarding by form_field_id rule)
-- ---------------------------------------------------------------------------
INSERT INTO issue_templates (
    id, organization_id, created_by_user_id, template_name, is_active, created_at, updated_at
)
SELECT c.onboarding_tpl_id, c.org_id, c.admin_user_id, 'Onboarding', true, NOW(), NOW()
FROM _cutover_config c
UNION ALL
SELECT c.offboarding_tpl_id, c.org_id, c.admin_user_id, 'Offboarding', true, NOW(), NOW()
FROM _cutover_config c;

INSERT INTO _map_form_field (legacy_id, template_item_id)
SELECT ff.form_field_id, gen_random_uuid()::text
FROM _legacy_form_fields ff;

INSERT INTO template_items (
    id, issue_template_id, title, default_status, default_assignee_user_id, order_index, created_at, updated_at
)
SELECT
    m.template_item_id,
    CASE
        WHEN ff.form_field_id IN (93,94,95,96,97,98,99,100,101,102,103,104,105,106,109)
        THEN c.onboarding_tpl_id
        ELSE c.offboarding_tpl_id
    END,
    ff.description,
    'open'::"IssueStatus",
    owner_user.id,
    COALESCE(ff.order_index, ff.form_field_id),
    COALESCE(ff."timestamp", NOW()),
    NOW()
FROM _legacy_form_fields ff
JOIN _map_form_field m ON m.legacy_id = ff.form_field_id
LEFT JOIN users owner_user ON owner_user.id = ff.owner
CROSS JOIN _cutover_config c;

-- ---------------------------------------------------------------------------
-- 5. Worker engagements
-- ---------------------------------------------------------------------------
INSERT INTO _map_form (legacy_id, engagement_id)
SELECT ef.id, gen_random_uuid()::text
FROM _legacy_employee_forms ef;

INSERT INTO worker_engagements (
    id, worker_id, organization_id, responsible_user_id, type, status,
    created_at, updated_at
)
SELECT
    mf.engagement_id,
    mw.worker_id,
    c.org_id,
    c.admin_user_id,
    CASE
        WHEN LOWER(TRIM(ef.form_type)) = 'onboarding' THEN 'onboarding'::"EngagementType"
        ELSE 'offboarding'::"EngagementType"
    END,
    'pending'::"EngagementProgress",
    COALESCE(ef."timestamp", NOW()),
    NOW()
FROM _legacy_employee_forms ef
JOIN _map_form mf ON mf.legacy_id = ef.id
JOIN _map_worker mw ON mw.legacy_id = ef.user_id
CROSS JOIN _cutover_config c;

-- ---------------------------------------------------------------------------
-- 6. Issues (from form_inputs)
-- ---------------------------------------------------------------------------
INSERT INTO _map_form_input (legacy_id, issue_id)
SELECT fi.id, gen_random_uuid()::text
FROM _legacy_form_inputs fi;

INSERT INTO issues (
    id, worker_engagement_id, created_by_user_id, template_item_id, status,
    title, assignee_user_id, created_at, updated_at
)
SELECT
    mi.issue_id,
    mf.engagement_id,
    c.admin_user_id,
    mff.template_item_id,
    CASE LOWER(TRIM(COALESCE(fi.status, '')))
        WHEN 'erledigt' THEN 'done'::"IssueStatus"
        WHEN 'in_bearbeitung' THEN 'in_progress'::"IssueStatus"
        ELSE 'open'::"IssueStatus"
    END,
    ff.description,
    owner_user.id,
    COALESCE(fi."timestamp", NOW()),
    NOW()
FROM _legacy_form_inputs fi
JOIN _map_form_input mi ON mi.legacy_id = fi.id
JOIN _map_form mf ON mf.legacy_id = fi.employee_form_id
JOIN _legacy_form_fields ff ON ff.form_field_id = fi.form_field_id
JOIN _map_form_field mff ON mff.legacy_id = fi.form_field_id
LEFT JOIN users owner_user ON owner_user.id = ff.owner
CROSS JOIN _cutover_config c;

-- ---------------------------------------------------------------------------
-- 7. Derive engagement status from child issues
-- ---------------------------------------------------------------------------
UPDATE worker_engagements we
SET status = sub.computed_status
FROM (
    SELECT
        i.worker_engagement_id,
        CASE
            WHEN COUNT(*) FILTER (WHERE i.status <> 'done') = 0 THEN 'completed'::"EngagementProgress"
            WHEN COUNT(*) FILTER (WHERE i.status <> 'open') = 0 THEN 'pending'::"EngagementProgress"
            ELSE 'in_progress'::"EngagementProgress"
        END AS computed_status
    FROM issues i
    GROUP BY i.worker_engagement_id
) sub
WHERE we.id = sub.worker_engagement_id;

-- ---------------------------------------------------------------------------
-- 8. History → issue_audit_logs + comments
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _history_ordered AS
SELECT
    h.id,
    h.form_input_id,
    h.status,
    h.edit,
    h.changed_by,
    h."timestamp",
    CASE LOWER(TRIM(COALESCE(h.status, '')))
        WHEN 'erledigt' THEN 'done'
        WHEN 'in_bearbeitung' THEN 'in_progress'
        ELSE 'open'
    END AS new_status_enum
FROM _legacy_history_form_data h
WHERE h.form_input_id IS NOT NULL;

CREATE TEMP TABLE _history_with_old AS
SELECT
    ho.*,
    mi.issue_id,
    COALESCE(
        LAG(ho.new_status_enum) OVER (
            PARTITION BY ho.form_input_id
            ORDER BY ho."timestamp", ho.id
        ),
        'open'
    ) AS old_status_enum
FROM _history_ordered ho
JOIN _map_form_input mi ON mi.legacy_id = ho.form_input_id;

INSERT INTO issue_audit_logs (
    id, issue_id, actor_user_id, action, old_value, new_value, created_at
)
SELECT
    gen_random_uuid()::text,
    h.issue_id,
    COALESCE(h.changed_by, c.admin_user_id),
    'issue.updated',
    jsonb_build_object('status', h.old_status_enum),
    jsonb_build_object('status', h.new_status_enum),
    h."timestamp"
FROM _history_with_old h
CROSS JOIN _cutover_config c;

INSERT INTO comments (id, issue_id, user_id, body, created_at, updated_at)
SELECT
    gen_random_uuid()::text,
    mi.issue_id,
    COALESCE(h.changed_by, c.admin_user_id),
    TRIM(h.edit),
    h."timestamp",
    h."timestamp"
FROM _legacy_history_form_data h
JOIN _map_form_input mi ON mi.legacy_id = h.form_input_id
CROSS JOIN _cutover_config c
WHERE h.edit IS NOT NULL AND TRIM(h.edit) <> '';

COMMIT;
