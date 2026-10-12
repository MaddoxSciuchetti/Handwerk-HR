# Pages reference conversion delta

Reference reviewed: the user's actual `Arbeitsvertrag_Blanco.pages`, exported
read-only through Pages to temporary PDF and Word copies on 2026-10-09.
The fresh PDF has 11 pages. Neither the original nor existing masters were changed.
No AI or OCR is used. These are measured improvements, not a claimed “10×” score.

| Source characteristic | Previous loss | Implemented correction |
| --- | --- | --- |
| Ten separate task bullets | Ten bullets merged into one paragraph | Ten semantic list items, with hanging-indent continuation kept inside its item |
| Blue, red and black text | No captured text colors | PDF graphics-state paint matching and DOCX inherited/direct run colors preserve `#215e99`, `#ee0000`, `#000000` |
| Left/justified body, genuinely centered introduction | Alignment guessed from individual line widths | PDF centering requires supporting heading/neighbor evidence; DOCX reads actual paragraph alignment, including inherited styles |
| Numbered clauses with interruptions/restarts | Word conversion restarted at 1 and inserted empty nesting wrappers | Resolve linked numbering styles, level/start overrides and numbering continuity; render the stored ordered-list start |
| Dash markers versus round bullets | Word converter displayed both as round bullets | Preserve dash/circle/disc markers and list indentation; numbering `none` stays plain prose |
| Repeated logo at its physical size | Shared PDF image objects disappeared after page 1; bitmap pixels determined display size | Recover all 11 occurrences and use the PDF transform; Word header image dimensions come from drawing extents |
| Appendix section boundaries | Word section breaks discarded | Preserve next-page section boundaries while leaving continuous sections in flow |
| Empty layout paragraphs | Empty Word paragraphs were discarded, collapsing the large spacer before the detailed Merkblatt | Reinsert unmatched empty body paragraphs with their font size and before/after spacing |
| Paragraph indentation | Left/right/first-line Word indents were not represented | Preserve `w:ind` as editor/PDF margins and text indentation |
| Signature date rows | Underlined Word tabs collapsed into adjacent text such as `den den` | Convert explicit Word tab stops into positioned labels and underline rules |
| Signature rules | Anchored Word vector lines disappeared | Preserve anchored line shapes with their page coordinates, width, color and stroke thickness |
| Save while reviewing/editing | Editor exited/re-hydrated and the original's newly signed URL reloaded its iframe | Keep editor/DOM/selection/scroll mounted, update revision in place, cache saved detail and retain a still-valid original URL |

The updated PDF benchmark captures 83 list items, a ten-item task group, zero
multi-bullet paragraphs, all three text colors, eleven images and ten page breaks.
Its inferred centered paragraphs fall from 16 to 9; that count alone does **not**
prove all paragraph geometry is exact. Word import preserves real wording and
paragraph styles rather than guessing from positioned PDF glyphs, but its
numbering must be cross-checked against the canonical Pages/PDF display. The
fresh Word export itself restarts some clauses differently from the fresh PDF.
The importer follows explicit Word numbering definitions; it does not silently
invent a different sequence. Pages/Quartz PDFs map Calibri
ligatures (tt, ti, ft, …) to single wrong characters in ToUnicode; the importer
recovers the letters by comparing the drawn glyph outline with the embedded font's
letter glyphs. It does not use word lists or rewrite text it cannot match.

## Reproduce and verify

From `server`, with fresh local exports:

```sh
node --import tsx test-integration/documentReference.compare.ts /absolute/reference.docx /absolute/reference.pdf
node --import tsx test-integration/documentImport.smoke.ts
```

The benchmark validates the structured result and prints only hashes, structural
counts, font families and colors—never document wording or employee values. It
does not upload references, mutate storage, or emit a final approved PDF.

Regression checks cover separate bullets, wrapped items, conservative alignment,
mixed paint colors/save-restore, inherited Word styles, numbering start overrides,
non-numbered paragraphs, section boundaries, empty layout spacing, paragraph
indents, explicit tab-stop geometry, anchored vector rules and HTML ordered-list starts. The
editor save test checks the same editor DOM, unchanged canvas scroll, continued
editability, stable original URL, no detail refetch, and revision advancement on a
second save.

Two newly created **local-only** comparison masters are available in the isolated
preview on port 5174: “Pages reference – improved PDF import (local comparison)”
and “Pages reference – improved DOCX import (local comparison)”. They are separate
from existing user masters and were not uploaded to S3. Existing imports do not
retroactively acquire new colors/structure: re-import as a new draft and review it
before replacing a master used by engagements.

## Remaining delta / release gate

- Full permitted Calibri and document-specific font variants are still missing.
  The editor visibly warns about substitute fonts; preparation/sending remains
  blocked. Font metrics and final line/page wrapping cannot be approved yet.
- Editable flowing HTML is not Pages' absolute-position layout. Explicit Word tab
  stops and anchored line rules are now retained, including the §14 signature
  geometry. Bordered salary text boxes are imported as editable tables, and
  PAGE/NUMPAGES fields are retained in the repeating footer for the PDF renderer.
  Other anchored text boxes, section-specific page settings and header variants
  still require review.
  Word imports the first header into the editable header section; PDF preserves
  each page's bitmap logo, but does not infer reusable header/footer semantics.
- The Pages Word export's numbering is not identical to the source PDF. Its
  clause numbering needs manual reconciliation before approval; do not treat
  successful OOXML import as proof that Pages exported the original faithfully.
  Select the affected numbered list in master editing and use “Formatierung und
  Felder → Liste beginnt bei” to set its source-verified start. Field keys stay
  unchanged. The PDF route retains the displayed numbers instead.
- This work does not establish pixel-perfect or final-PDF visual approval. After
  supplying fonts, compare all generated pages against the fresh Pages PDF at the
  same physical scale, then record explicit master/PDF approval.

The local comparison has improved import fidelity, but it is not the approved
outgoing employment contract.

## Document layout follow-up (2026-10-11)

Completed the interrupted Cursor changes in `codex/styled-document-pdf`:

- Party caption spacing can span Word runs; the company label centers using its
  rendered width, with a normal underline instead of a full-width rule.
- Centered address/caption paragraphs retain separate lines. Underlined words
  alone do not turn a paragraph into a signature rule. Centered paragraphs do
  not keep hanging list indents.
- The salary text box becomes a five-row bordered table. Physical width, label
  and amount columns, blank underlines, text colors and total emphasis survive
  editing and saving.
- Complex and simple Word page fields survive import. Native footer parts are
  imported, and the Pages footer embedded in a header is moved to the footer.
  Unknown fields retain their cached text.
- The editor shows page-field labels; the PDF footer supplies empty native
  `pageNumber` / `totalPages` spans for Chromium to populate after pagination.
  Footer padding stays inside the printable width so right alignment is visible.

Verification: `node --import tsx test-unit/docxLayout.verify.ts` covers the
caption, real tab characters, centered indents, table, native footer, simple and
complex fields, and preservation of an unrelated DATE field. Server PDF tests
check the multipart footer HTML; editor tests check retained layout metadata.
A fresh export from a temporary copy of the actual Pages source was imported for
visual inspection without changing the source or saved masters. The local
Gotenberg service/Docker daemon was unavailable, so final PDF pagination and
font approval remain unverified; the earlier release gate still applies.
