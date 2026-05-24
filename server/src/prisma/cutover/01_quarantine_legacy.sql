-- =============================================================================
-- 01_quarantine_legacy.sql
-- Rename legacy tables so the new Prisma schema can be applied without collisions.
-- Legacy data is preserved in _legacy_* tables for ETL in step 03.
-- =============================================================================

BEGIN;

-- Auth users (quoted "User" table)
ALTER TABLE IF EXISTS "User" RENAME TO _legacy_user;

-- HR workers (lowercase users — conflicts with new auth users table)
ALTER TABLE IF EXISTS users RENAME TO _legacy_workers;
ALTER INDEX IF EXISTS users_pkey RENAME TO _legacy_workers_pkey;
ALTER INDEX IF EXISTS users_email_key RENAME TO _legacy_workers_email_key;
ALTER INDEX IF EXISTS "users_archivedAt_idx" RENAME TO _legacy_workers_archived_at_idx;

-- Onboarding/offboarding workflow
ALTER TABLE IF EXISTS employee_forms RENAME TO _legacy_employee_forms;
ALTER TABLE IF EXISTS form_fields RENAME TO _legacy_form_fields;
ALTER TABLE IF EXISTS form_inputs RENAME TO _legacy_form_inputs;

-- Sessions (discarded at ETL; kept for emergency recovery)
ALTER TABLE IF EXISTS "Session" RENAME TO _legacy_session;

-- Files, status, history, verification
ALTER TABLE IF EXISTS "WorkerFiles" RENAME TO _legacy_worker_files;
ALTER TABLE IF EXISTS "EmployeeStatus" RENAME TO _legacy_employee_status;
ALTER TABLE IF EXISTS "HistoryFormData" RENAME TO _legacy_history_form_data;
ALTER TABLE IF EXISTS "VerificationCode" RENAME TO _legacy_verification_code;

-- Clear migration history so prisma migrate deploy can run fresh
TRUNCATE TABLE _prisma_migrations;

COMMIT;
