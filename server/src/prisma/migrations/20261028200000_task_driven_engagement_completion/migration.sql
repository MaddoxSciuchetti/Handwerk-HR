-- Keep the legacy expected enum value for rolling deployments, but never store it.
-- Completion depends on all tasks, including tasks hidden from the current viewer.
CREATE FUNCTION normalize_engagement_task_progress() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    task_count bigint;
    open_count bigint;
BEGIN
    IF NEW.status = 'expected' THEN
        NEW.status := 'pending';
    END IF;

    -- Cancelled engagements and task-free team records retain their lifecycle.
    IF NEW.status = 'cancelled' OR NEW.type = 'transfer' THEN
        RETURN NEW;
    END IF;

    SELECT count(*), count(*) FILTER (
        WHERE status NOT IN ('done', 'cancelled', 'not_applicable')
    ) INTO task_count, open_count
    FROM issues WHERE worker_engagement_id = NEW.id;

    IF task_count > 0 AND open_count = 0 THEN
        NEW.status := 'completed';
        NEW.completed_at := COALESCE(NEW.completed_at, CURRENT_TIMESTAMP);
    ELSIF NEW.status = 'completed' THEN
        NEW.status := CASE WHEN task_count = 0 THEN 'pending'::"EngagementProgress"
                           ELSE 'in_progress'::"EngagementProgress" END;
        NEW.completed_at := NULL;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER engagement_task_progress
BEFORE INSERT OR UPDATE OF status ON worker_engagements
FOR EACH ROW EXECUTE FUNCTION normalize_engagement_task_progress();

CREATE FUNCTION sync_engagement_task_progress() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    old_engagement_id text;
    new_engagement_id text;
    engagement_id text;
BEGIN
    IF TG_OP <> 'INSERT' THEN
        old_engagement_id := OLD.worker_engagement_id;
    END IF;
    IF TG_OP <> 'DELETE' THEN
        new_engagement_id := NEW.worker_engagement_id;
    END IF;

    -- Lock parents in a stable order; moving a task updates both engagements.
    FOR engagement_id IN
        SELECT id FROM worker_engagements
        WHERE id IN (old_engagement_id, new_engagement_id)
        ORDER BY id FOR UPDATE
    LOOP
        UPDATE worker_engagements
        SET status = status, updated_at = CURRENT_TIMESTAMP
        WHERE id = engagement_id;
    END LOOP;
    RETURN NULL;
END;
$$;

-- Database enforcement covers manual changes, bulk operations and automations
-- in the same transaction as the task change.
CREATE TRIGGER issue_engagement_task_progress
AFTER INSERT OR DELETE OR UPDATE OF status, worker_engagement_id ON issues
FOR EACH ROW EXECUTE FUNCTION sync_engagement_task_progress();

-- Reconcile existing records, including previously expected onboardings.
UPDATE worker_engagements SET status = status, updated_at = CURRENT_TIMESTAMP;
