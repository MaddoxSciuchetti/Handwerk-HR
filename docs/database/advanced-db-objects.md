# Database Objects

## `updated_at` trigger

Implemented a simple trigger function that updates the column `updated_at` whenever the value inside that row changes. This ensures that under no circumstance can the `updated_at` column be stale. Migrations for this procedure live under `server/src/prisma/migrations/` (see e.g. `20260501134840_add_set_updated_at_trigger`).

## The reusable function

Below is the reusable function that was implemented to ensure that the rows are being updated:

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Applying the trigger

It was applied as seen below:

```sql
DROP TRIGGER IF EXISTS set_updated_at ON "users";
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

`DROP TRIGGER IF EXISTS` makes the migration idempotent. The trigger runs `BEFORE UPDATE` on each affected row (`FOR EACH ROW`) so `updated_at` is set in the same statement as the row change. The same pattern is applied to other tables in that migration, not only `users`.
