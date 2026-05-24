-- =============================================================================
-- 05_backfill_assignees.sql
-- Restore template/item owners missed during initial ETL.
-- Legacy source: _legacy_form_fields.owner -> template_items.default_assignee_user_id
--                                     -> issues.assignee_user_id (via template_item_id)
-- Safe to re-run: only updates rows where assignee is currently NULL.
-- =============================================================================

BEGIN;

UPDATE template_items ti
SET default_assignee_user_id = ff.owner
FROM _legacy_form_fields ff
JOIN users u ON u.id = ff.owner
WHERE ti.default_assignee_user_id IS NULL
  AND TRIM(ti.title) = TRIM(ff.description);

UPDATE issues i
SET assignee_user_id = ti.default_assignee_user_id
FROM template_items ti
WHERE i.template_item_id = ti.id
  AND i.assignee_user_id IS NULL
  AND ti.default_assignee_user_id IS NOT NULL;

COMMIT;
