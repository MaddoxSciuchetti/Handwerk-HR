-- No-op: baseline migration `20260427210000_baseline` already defines `SubscriptionPlan`
-- with values including `free`. Re-applying `ADD VALUE 'free'` fails on shadow DB replay
-- (PostgreSQL: enum label "free" already exists).
SELECT 1;
