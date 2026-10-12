# Styled document masters and approved PDF delivery

Implementation checkpoint: `0066acb7`, isolated branch `codex/styled-document-pdf`.
No AI, OCR, external font CDN, or PDF-subset extraction is used.

See [the reference conversion delta](document-conversion-delta.md) for measured
changes against the actual Pages source, reproducible benchmarks and remaining
layout/font limitations. Word/DOCX preserves editable wording and styles better,
but Pages-exported numbering still needs comparison against the original PDF.
Native Pages import remains unsupported.

## Deployment prerequisites

1. Supply full font files with rights for web distribution and PDF embedding. Set
   `DOCUMENT_FONT_DIR` to an absolute directory accessible to the API. The minimum
   application fonts are `Calibri.ttf`, `Calibri-Bold.ttf`, `Calibri-Italic.ttf`.
   Combined bold/italic content also requires `Calibri-BoldItalic.ttf`.
2. Document-specific fonts use the same naming convention: `Arial.ttf`,
   `Arial-Bold.ttf`, `Arial-Italic.ttf`, `Arial-BoldItalic.ttf`; likewise
   `Helvetica*` and `TimesNewRoman*`. Supply every variant actually used.
   Files are ignored by Git. Do not treat the Arial system-font test fixture as
   licensed production assets. The API blocks preparation if a used font is missing.
   The BSB PDF also references symbol families: `Symbol.ttf`, `AppleSymbols.ttf`
   and `Wingdings.ttf`. Preserve them with permitted full files or deliberately
   replace individual symbols during master review; do not silently substitute.
3. Run a private Gotenberg Chromium service. For local use:
   `docker compose -f compose.documents.yml up -d`, then set
   `GOTENBERG_URL=http://127.0.0.1:3001`. Mount the same font directory into the
   container. Conversion embeds the exact font bytes and snapshots their hashes.
   HTTP(S) resource loading is denied; all document images and fonts are local data.
   Native Chromium header/footer templates use installed fonts, not web-font URLs.
   The generated PDF is inspected for unexpected font families/variants; a renderer
   substitution blocks preparation rather than silently changing the approved style.
   Keep the renderer off the public internet; use a private network in deployment.
   Pin the tested Gotenberg image digest in production.
4. Configure existing private S3 credentials/bucket. Enable Block Public Access and
   encryption at the bucket level. Signed preview links expire after one hour;
   access to endpoints issuing them requires authentication and organization scope.
   Links are bearer credentials: do not log or share them.
   Local development can use `AWS_PROFILE`, `AWS_REGION` and `AWS_S3_BUCKET` after
   confirming the intended development bucket. The SDK reads the existing local
   AWS profile; do not copy access keys into the repository. In production, prefer
   an IAM role. Explicit key pairs remain supported, including `AWS_SESSION_TOKEN`
   for temporary credentials; incomplete key pairs are rejected.
   The isolated local preview has an ignored `server/.env` configured for the
   approved development bucket `bsb-onboarding-development` in `eu-north-1`, using
   AWS profile `temper-3455`. No AWS credential values are stored in that file.
5. Review and apply the additive migration
   `server/src/prisma/migrations/20261009190000_styled_documents/migration.sql`
   using the existing migration deployment process. Generate the Prisma client.
   Back up the database first. No live migration is part of this implementation.
6. Configure the existing mail provider. `USE_MICROSOFT_MAIL=true` uses Graph;
   otherwise PDF attachments use Resend. Contracts retain their existing Graph
   conversation IDs or Resend reply tokens. Arbeitszeugnisse retain the existing
   Microsoft-365 sender/account configuration when Graph is selected.

## Authoring and review

- Import PDF, DOCX or TXT under Settings → Documents. Original uploads remain
  private in S3. PDF originals appear beside the reconstructed editor.
- PDF import preserves positions, font metadata, sizes and original page boundaries.
  Aligned consecutive rows can become basic tables; bitmap graphics are recovered
  where available. Vector letterheads, complex tables, rotated text, mixed page
  sizes and header/footer placement require manual correction. Import is a reviewed
  draft, not a promise of pixel-perfect reconstruction.
- DOCX uses Mammoth HTML. Correct fonts, page layout and table details manually.
  TXT is unstyled. Export Pages to PDF first. Scanned-only PDFs are rejected.
- Edit wording, formatting, images, tables, page dimensions/margins, and separate
  header/footer sections. Text/date/checkbox fields carry stable keys. A label can
  change without changing its key. Reusing a key shares a value; an explicit new
  key creates an independent field. Repeated types/required flags must agree.
- Save and approve the master only after reviewing it against the original.
  Any subsequent save increments its revision and requires a new approval.
  Legacy masters read through an adapter; saving adopts version 3 without changing
  field keys. Historical sent/signed bodies are not rewritten.
- The editing workspace offers a large view, view-only zoom, and an optional
  original-document comparison panel. Formatting and page-layout controls collapse
  to leave more room for text. Narrow editing views reflow text without changing
  saved page dimensions, font sizes, or the generated PDF. The actual prepared PDF
  remains the authoritative pre-send preview.
- PDF alignment detection defaults long margin-aligned prose and table cells to
  left alignment, retaining clearly centered short headings. Existing imports are
  not silently rewritten: use “Formatierung und Felder → Fließtext linksbündig”
  to correct long centered paragraphs without changing short headings or field
  keys; use “Alles linksbündig” only when intentionally resetting all alignment.
- Engagement review locks wording and lets users change field values or drag
  unmatched deterministic answers onto fields. Draft corrections are saved on
  preparation, close, or navigation to the master. An unchecked checkbox is valid
  unless marked “must be checked.” Date values accept ISO or German dates.
- “Finales PDF erstellen und prüfen” snapshots the approved master and values.
  Review the actual stored PDF and explicitly approve it before sending.
  Editor chips, controls and placeholder labels are absent from the output.
  Sending uses the stored bytes, never another rendering. Returned signed PDFs
  remain separate from outgoing PDFs.

## Failure and concurrency handling

Values survive renderer/font/storage failures. Value saves invalidate safe active
preparations. Preparation and send transactions lock the engagement row and check
saved values, master selection/revision, recipient and PDF SHA-256. Only one send
can claim an artifact. An approved artifact is reusable after a definite provider
rejection. Resend receives its artifact ID as an idempotency key.

Network timeouts and ambiguous provider failures produce `uncertain`, not a safe
retry. If the provider accepts mail but final database persistence fails, status
remains `sending`. Both states block new preparation and sending. An operator must
reconcile the provider's sent-mail record before changing state; never blindly reset
these records or resend. There is deliberately no automatic ambiguous-send retry.
The PDF limit is 2.5 MB to fit Graph's inline attachment path; oversized documents
must reduce image sizes. Large-attachment upload sessions are outside v1.

Prepared PDFs and originals need the organization's normal retention policy.
Full font assets are also snapshotted privately in S3 with their hashes.
Interrupted/stale preparations can leave unreferenced S3 objects; a scoped retention
job should remove them only after checking metadata and legal retention obligations.
Generation/delivery outcomes log identifiers and hashes, not employee values or
document wording.

## Verification and release gate

Focused tests cover deterministic aliases, stable/repeated keys, renamed labels,
manual values, both document types, checkbox/date validation, escaped rendering,
imports, stale drafts/revisions, organization scope, byte/hash verification, provider
attachments, concurrent claims and safe versus uncertain retries. Component tests
cover value-only editing, read-only signed review and explicit PDF approval.

The renderer smoke test uses local Arial fixtures and produces an actual multipage
PDF with long German names, umlauts, a checkbox, table and header/footer. Mount a
permitted test directory containing `Arial.ttf` and `Arial-Bold.ttf` into the renderer
using `DOCUMENT_FONT_DIR`, then run
`cd server && DOCUMENT_SMOKE_FONT_DIR=/absolute/test-font-directory node --import tsx --require ./jest.setup.cjs test-integration/documentRenderer.smoke.ts`.
Without that override, the script copies explicitly selected macOS Arial fixture
files to a temporary directory; the renderer must still have the same fonts installed.
This verifies rendering, not Calibri fidelity or production mail/S3 integration.

Do not release until permitted full Calibri/document-specific assets are supplied,
the BSB contract and a representative Arbeitszeugnis have been manually corrected
and visually approved, and staging S3/Graph/Resend checks confirm identical approved,
stored and attached hashes. Check font embedding, text extraction, long/multiline
values, page breaks and table pagination. Live provider integration and the final
BSB visual approval require deployment inputs; unit tests do not replace them.

Implementation verification (2026-10-09): all 90 server tests and 15 client unit
tests passed; server type-check and both production builds passed. All 26 repository
migrations applied to a disposable PostgreSQL database, where both drafts reopened
with manual values and returned signed snapshots stayed unchanged. Native renderer
pages were visually checked and embedded Arial fonts/umlauts verified. Removing
renderer fonts correctly blocked preparation. Disposable test containers and the
test database volume were removed afterward. The client-wide type-check has the
same pre-existing unrelated errors as checkpoint `0066acb7`; changed editor files
pass focused lint checks.
