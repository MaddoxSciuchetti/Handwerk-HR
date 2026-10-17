# Document editor branch audit — 2026-10-13

## Finding

The overlap in preview master `cc2ba554-12a9-44a2-9298-27bff1203cfe` is an editor regression/integration gap, rather than an omitted document branch merge. This master was imported from DOCX on 2026-10-13 at 14:23 Berlin time and remains at revision 1, so it is not a stale pre-fix import.

The importer correctly stores the checkbox at 14pt and the accompanying sentence at 8pt, with a separate 8pt `bis zum` label positioned at 369.35pt. The editor's `labelContent` conversion in Cursor-coauthored commit `fd4b9108` stored each run's font size as a string such as `8pt`, although the editor layout extension and server model expect a numeric point value. The layout extension appended another `pt`, producing invalid `8ptpt` CSS. The sentence therefore inherited the surrounding label's 14pt size and overlapped the adjacent label.

A second integration gap prevented edited positioned labels from saving: the editor emits `lineLabel` nodes, while `parseStyledDocument` omitted that node type from its allowlist.

Opening directly in editable view exposed the existing conversion defect immediately. Previous editing tests used numeric text-style marks or labels without mixed-size runs and did not catch this real import path.

## Branches and workspaces checked

- `codex/styled-document-pdf` at `277084d2`: the document importer and shared rendering fixes are present.
- `codex/automation-purple-glitter` at `64d84c2a`: includes the document branch through merges `28fe4c28` and `9a788760`. Importer and shared rendering files match the styled-document branch.
- Main checkout, `feature/onboarding-automation`: also contains those merged document changes. Its newer committed changes concern Microsoft 365/mail templates; current questionnaire changes are unrelated to the caption rendering defect.
- Staging worktree: predates the styled-document feature integration and has no newer missing caption fix.
- Cursor workspace registrations: identify the main checkout, staging, both Codex worktrees, and older `Rebuilding_Project` / `fixies-branch` directories. The older directories have no current document editor. The old Handwerk_Umfrage paths no longer exist.
- Cursor saved local history: no alternate saved versions of the relevant importer, rendering, or editor files were found.
- Detached/unreachable commits: Cursor work-in-progress snapshot `2eae8833` and its index snapshot `da161d1d` were inspected. The relevant document code in the WIP snapshot matches later committed `277084d2`; no separate layout fix remains to recover. The remaining unreachable commit concerns the landing page.
- Existing stash: changes only `.gitignore`, with no document fixes.

## Corrections and verification

- Keep imported run font sizes as numeric point values in `labelContent`.
- Accept and validate editable `lineLabel` nodes in the backend, including their parent, coordinates, and inline content.
- Regression test reproduces the 14pt checkbox / 8pt sentence / adjacent tab label, checks valid rendered CSS and numeric saved marks.
- Client-to-server round-trip tests preserve mixed font sizes, color, edited text, and reject invalid label geometry or block content.
- Existing selection/save tests continue to pass.
- The exact screenshot master's normalized editor representation passes server save validation. The stored master was not modified during verification.

These corrections are committed separately on `codex/automation-purple-glitter`. No branches were merged or reset during this audit.
