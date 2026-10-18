-- Run after the lifecycle time-tracking migration. All test data is rolled back.
BEGIN;
CREATE TEMP TABLE lifecycle_time_test (
    id TEXT PRIMARY KEY, status TEXT, created_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ
);
CREATE TRIGGER test_task_tracking BEFORE INSERT OR UPDATE ON lifecycle_time_test
FOR EACH ROW EXECUTE FUNCTION track_lifecycle_elapsed_time('done');
INSERT INTO lifecycle_time_test VALUES ('task', 'open', NOW() - INTERVAL '2 days', NULL, NULL);
DO $$ BEGIN
    ASSERT (SELECT started_at = created_at AND completed_at IS NULL FROM lifecycle_time_test WHERE id = 'task'), 'creation starts tracking';
END $$;
UPDATE lifecycle_time_test SET status = 'done' WHERE id = 'task';
DO $$ BEGIN
    ASSERT (SELECT completed_at IS NOT NULL AND completed_at >= started_at FROM lifecycle_time_test WHERE id = 'task'), 'completion stops tracking';
END $$;
CREATE TEMP TABLE lifecycle_completion_snapshot AS SELECT * FROM lifecycle_time_test;
UPDATE lifecycle_time_test SET completed_at = NOW() + INTERVAL '1 day', started_at = NOW() WHERE id = 'task';
DO $$ BEGIN
    ASSERT (SELECT t.completed_at = s.completed_at AND t.started_at = s.started_at FROM lifecycle_time_test t JOIN lifecycle_completion_snapshot s USING (id)), 'later edits preserve duration';
END $$;
UPDATE lifecycle_time_test SET status = 'in_progress' WHERE id = 'task';
DO $$ BEGIN
    ASSERT (SELECT completed_at IS NULL AND started_at = created_at FROM lifecycle_time_test WHERE id = 'task'), 'reopening clears completion and preserves start';
END $$;
UPDATE lifecycle_time_test SET status = 'done' WHERE id = 'task';
DO $$ BEGIN
    ASSERT (SELECT completed_at IS NOT NULL FROM lifecycle_time_test WHERE id = 'task'), 'recompletion records completion';
END $$;
INSERT INTO lifecycle_time_test VALUES ('automated', 'done', NOW() - INTERVAL '1 hour', NULL, NULL);
DO $$ BEGIN
    ASSERT (SELECT completed_at IS NOT NULL FROM lifecycle_time_test WHERE id = 'automated'), 'created-done tasks track completion';
END $$;
DROP TRIGGER test_task_tracking ON lifecycle_time_test;
CREATE TRIGGER test_engagement_tracking BEFORE INSERT OR UPDATE ON lifecycle_time_test
FOR EACH ROW EXECUTE FUNCTION track_lifecycle_elapsed_time('completed');
INSERT INTO lifecycle_time_test VALUES ('worker', 'pending', NOW() - INTERVAL '3 days', NULL, NULL);
UPDATE lifecycle_time_test SET status = 'completed' WHERE id = 'worker';
DO $$ BEGIN
    ASSERT (SELECT completed_at IS NOT NULL AND started_at = created_at FROM lifecycle_time_test WHERE id = 'worker'), 'worker completion tracks duration';
END $$;
UPDATE lifecycle_time_test SET status = 'cancelled' WHERE id = 'worker';
DO $$ BEGIN
    ASSERT (SELECT completed_at IS NULL FROM lifecycle_time_test WHERE id = 'worker'), 'cancellation clears completion';
END $$;
ROLLBACK;
