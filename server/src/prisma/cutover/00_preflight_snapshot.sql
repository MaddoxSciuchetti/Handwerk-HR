-- =============================================================================
-- 00_preflight_snapshot.sql
-- Read-only baseline checks. Run against production BEFORE any cutover work.
-- Save output to baseline/ for diffing after rehearsal ETL.
-- =============================================================================

\echo '=== A. Row-count baseline ==='
SELECT 'User' AS tbl, COUNT(*)::bigint AS cnt FROM "User"
UNION ALL SELECT 'users_workers', COUNT(*)::bigint FROM users
UNION ALL SELECT 'employee_forms', COUNT(*)::bigint FROM employee_forms
UNION ALL SELECT 'form_fields', COUNT(*)::bigint FROM form_fields
UNION ALL SELECT 'form_inputs', COUNT(*)::bigint FROM form_inputs
UNION ALL SELECT 'HistoryFormData', COUNT(*)::bigint FROM "HistoryFormData"
ORDER BY tbl;

\echo '=== B. Referential integrity (expect all zeros) ==='
SELECT 'orphan_inputs' AS check_name, COUNT(*)::bigint AS cnt
FROM form_inputs fi
LEFT JOIN employee_forms ef ON ef.id = fi.employee_form_id
WHERE ef.id IS NULL
UNION ALL
SELECT 'orphan_field_refs', COUNT(*)::bigint
FROM form_inputs fi
LEFT JOIN form_fields ff ON ff.form_field_id = fi.form_field_id
WHERE ff.form_field_id IS NULL
UNION ALL
SELECT 'orphan_history', COUNT(*)::bigint
FROM "HistoryFormData" h
LEFT JOIN form_inputs fi ON fi.id = h.form_input_id
WHERE fi.id IS NULL
UNION ALL
SELECT 'orphan_actors', COUNT(*)::bigint
FROM "HistoryFormData" h
LEFT JOIN "User" u ON u.id = h.changed_by
WHERE h.changed_by IS NOT NULL AND u.id IS NULL
UNION ALL
SELECT 'orphan_forms', COUNT(*)::bigint
FROM employee_forms ef
LEFT JOIN users lw ON lw.id = ef.user_id
WHERE lw.id IS NULL;

\echo '=== C. Template ID coverage (Onboarding=15, Offboarding=13) ==='
SELECT
  CASE
    WHEN form_field_id IN (93,94,95,96,97,98,99,100,101,102,103,104,105,106,109)
    THEN 'Onboarding'
    ELSE 'Offboarding'
  END AS expected_template,
  COUNT(*)::bigint AS field_count
FROM form_fields
GROUP BY 1
ORDER BY 1;

\echo '=== D. Per-engagement task status snapshot ==='
SELECT ef.id AS form_id, ef.form_type, lw.vorname, lw.nachname,
       COALESCE(fi.status, '(null)') AS task_status, COUNT(*)::bigint AS cnt
FROM employee_forms ef
JOIN users lw ON lw.id = ef.user_id
JOIN form_inputs fi ON fi.employee_form_id = ef.id
GROUP BY 1, 2, 3, 4, 5
ORDER BY 1, 5;

\echo '=== E. History completeness ==='
SELECT h.id, h.form_input_id, h.status,
       (h.edit IS NOT NULL AND TRIM(h.edit) <> '') AS has_note,
       h."timestamp"
FROM "HistoryFormData" h
ORDER BY h."timestamp";

\echo '=== F. Password hash sanity ==='
SELECT id, email,
       (password LIKE '$2b$10$%') AS valid_bcrypt,
       (LENGTH(password) = 60) AS valid_length
FROM "User"
ORDER BY email;

\echo '=== G. Auth users ==='
SELECT id, email, vorname, nachname, user_permission::text, verified
FROM "User"
ORDER BY email;

\echo '=== H. Workers ==='
SELECT id, email, vorname, nachname, "position", eintrittsdatum, "archivedAt"
FROM users
ORDER BY id;
