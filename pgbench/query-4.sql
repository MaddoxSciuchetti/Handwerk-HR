\set org_offset random(1, 1000)

SELECT
    ist.*,
    (
      SELECT COUNT(*)::int
      FROM issues i
      WHERE i.status_id = ist.id
    ) AS issues_using_status
FROM issue_statuses ist
WHERE ist.organization_id = (
    SELECT id FROM organizations OFFSET :org_offset LIMIT 1
)
ORDER BY ist.order_index ASC;