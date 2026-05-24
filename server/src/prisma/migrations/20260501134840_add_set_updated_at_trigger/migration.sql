
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON "users";
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON "organizations";
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON "organizations"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON "organization_members";
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON "organization_members"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON "engagement_statuses";
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON "engagement_statuses"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON "issue_statuses";
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON "issue_statuses"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON "workers";
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON "workers"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON "worker_engagements";
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON "worker_engagements"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON "issue_templates";
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON "issue_templates"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON "template_items";
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON "template_items"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON "issues";
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON "issues"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON "subscriptions";
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON "subscriptions"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON "absences";
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON "absences"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
