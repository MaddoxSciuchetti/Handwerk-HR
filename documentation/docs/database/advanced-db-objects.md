# Database Objects

## `updated_at` trigger

Implemented a simple trigger function that updates the column `updated_at` whenever the value inside that row changes. This ensures that under no circumstance can the `updated_at` column be stale. Migrations for this procedure are all visible under `prisma/migrations`.

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

First it is checked whether the trigger already exists. If this is not the case it creates the trigger, before the update on the `users` table, and with a loop executes it for each row.
