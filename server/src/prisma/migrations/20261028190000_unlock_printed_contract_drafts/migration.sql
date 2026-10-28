-- Printing used to mark contracts as sent and lock further edits. Restore those
-- unsigned drafts; retain the printed PDF artifact and existing task statuses.
UPDATE employment_contracts AS contract
SET status = 'draft',
    sent_at = NULL,
    body = NULL,
    outgoing_pdf_id = NULL,
    updated_at = NOW()
FROM prepared_documents AS artifact
WHERE contract.outgoing_pdf_id = artifact.id
  AND artifact.kind = 'employment_contract'
  AND artifact.provider_id = 'office-print'
  AND contract.status <> 'signed'
  AND contract.file_url IS NULL;
