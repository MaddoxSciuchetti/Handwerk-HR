# Questionnaire values and contract PDF rendering

Investigated on `feature/onboarding-automation`, 17 October 2026.

## Questionnaire values

The contract dialog used a one-time initialization from React Query data. An empty
cached contract could initialize the local fields before a fresh response arrived
with the completed questionnaire's values. Later responses were ignored. At the
same time, the API omitted placed answers from `unmatchedAnswers`, so those values
could be invisible in both the editor and the sidebar despite existing in storage.

The dialog now accepts fresh values until the user edits, preserving subsequent
manual corrections. The API also supplies the complete set of textual questionnaire
answers, and the dialog calculates unplaced answers against its current field
values. Clearing a field makes its answer available again. File uploads are not
contract text. Historical answers without available labels remain accessible by key.

Matching also retains name parts for combined-name fields after an explicit link,
and tolerates questionnaires that omit the standard personal-data questions.

## PDF defects

The PDF path is DOCX -> Mammoth + custom Word layout restoration -> editor JSON ->
HTML -> Gotenberg Chromium. It does not convert the original Word file to PDF.

When Arial or another unavailable font was substituted with Carlito, the server
inserted literal double quotes into an already double-quoted HTML style attribute.
The browser then discarded subsequent declarations, including small signature
caption sizes. The editor did not perform this substitution and kept its sizes.
This explains captions overlapping the receipt sentence and date rules crossing
text in the reported previews.

Font names are now HTML-escaped inside style attributes. Positioned labels also
use a shared explicit line height and shared row-height calculation in the editor
and PDF, so inherited body leading and edited text sizes cannot silently overflow
their reserved rows.

A local headless Chromium comparison of the active contract template measured 62
positioned labels extending below their rows before the fix and zero afterward.
The production `generateDocumentPdf` function also passed its embedded-font checks
for the contract body with the local browser standing in for the Gotenberg route.
This checks the application's HTML/CSS and font substitution; the local Docker
Gotenberg service was stopped, so it does not replace deployment verification of
the pinned container, repeating headers/footers, or PDF storage and print flows.

## Rendering approach

Keep the prepared PDF as the authoritative print preview, and print those same
stored bytes. Keep editor and export layout rules shared, use the same full fonts
in both, and retain real-template rendering checks. Use original licensed fonts
when Word fidelity matters: Carlito is a Calibri substitute, and substituting it
for Arial or Times New Roman can change text widths and page breaks.

Mammoth explicitly aims for semantic HTML rather than identical Word appearance;
its documentation warns about complex-document conversion and unsupported table
formatting. More custom reconstruction cannot guarantee Word parity.

If exact Word layout becomes a product requirement, a separate DOCX-native path
should fill fields in the source DOCX and render that filled DOCX through
Gotenberg's LibreOffice route. This requires preserving all edits in DOCX rather
than converting the unedited original while the user edits a separate JSON model.
LibreOffice output still needs comparison with Word using the actual fonts.
A full paginated editor/conversion system is another larger migration; Tiptap's
Pages documentation requires its pagination-safe table extension and describes
remaining limitations. Neither change is needed to fix the confirmed HTML bug.

Primary references checked:

- [Mammoth design and supported features](https://github.com/mwilliamson/mammoth.js#readme)
- [Gotenberg HTML-to-PDF route and options](https://gotenberg.dev/docs/convert-with-chromium/convert-html-to-pdf)
- [Gotenberg conversion routes, including LibreOffice](https://gotenberg.dev/docs/getting-started/routes)
- [Tiptap Pages limitations](https://tiptap.dev/docs/pages/core-concepts/limitations)


## Verification

- Client regression tests cover stale cached drafts, server refreshes, manual edits,
  and cleared values returning to the sidebar; editor/selection tests also pass.
- Server tests cover linked and composite names, reduced questionnaires, answer
  visibility, positioned rows, DOCX layout, and substituted-font HTML attributes.
- Both production builds pass. The repository-wide server type check still reports
  existing errors in `.ts` imports in the DOCX verification script and the
  billing-invoice fixture; none are introduced by
  these changes.
- The database inspection was read-only. No staging deployment or stored contract
  rewrite was performed. Existing prepared PDFs must be regenerated after release
  to pick up rendering changes.


## Worker information preview

Questionnaire completion now uses a shared worker-profile mapping for names,
birthday, street, postal code, city, position (`jobTitle`) and entry date. Position
and entry date were missing from the previous submission mapping. Dates are stored
as validated calendar dates in UTC.

Worker details also fill empty profile fields from completed questionnaires, newest
first. This makes historical answers available to the information preview without
requiring users to resubmit questionnaires or rewriting existing database records.
Non-empty saved profile values take precedence, preserving manual corrections;
unsent questionnaires and invalid historical dates are excluded. The response does
not expose the raw questionnaire answer rows.

Regression tests cover submission persistence, historical fallback, manual values,
questionnaire ordering, invalid dates, organization-scoped worker lookup, and the
information modal's formatted birthday, full address, entry date and position.


## Selecting another contract template

The prefilled contract preview now offers **Vertragsvorlage** and **Vorlage
wechseln und neu ausfüllen**. Select another employment-contract template to rematch
stored questionnaire answers against its fields. The switch clears manual values,
invalidates the old prepared PDF and approval, and returns to draft review.
Templates are limited to active employment contracts in the same organisation.
Printed/sent and signed contracts cannot switch templates.

The selection is saved on the worker's contract. The organisation's primary
contract is now used as the initial default at creation, rather than being imposed
again during every read. Changing a worker's template leaves the organisation's
default and other workers' contracts untouched. The switch checks for template
changes during matching, and a draft save racing with a switch is rejected.


## Local PDF service recovery

The PDF creation failure on 17 October was reproduced with Docker Desktop stopped
and no Gotenberg listener on port 3001. The local API also referenced a removed
worktree for its configured font directory. Docker Desktop and the repository's
Gotenberg container were started, the font path was corrected to this checkout,
and the API was restarted. A real ten-page contract PDF was generated through
Gotenberg with embedded-font verification passing and its signature page inspected.

Renderer connection failures and timeouts now return an actionable 503 error
instead of an unhandled fetch error and generic toast. From `server/`,
`npm run dev:documents` starts the renderer and API together (Docker must be running).
