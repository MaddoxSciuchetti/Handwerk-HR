-- Chat edits may change text and updated_at, but cannot move or reattribute messages.
CREATE OR REPLACE FUNCTION prevent_comment_update()
RETURNS trigger AS $$
BEGIN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.issue_id IS DISTINCT FROM OLD.issue_id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'Comment identity, author, task and creation date cannot be changed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
