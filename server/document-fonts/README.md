# Font deployment assets

Supply full, licensed TTF files here or set `DOCUMENT_FONT_DIR` to another
directory. Licensed fonts are intentionally ignored by Git.

Carlito (SIL Open Font License, see `Carlito-OFL.txt`) is committed as the
stand-in for Calibri, and for Arial, Helvetica, and Times New Roman when those
licensed files are missing. Calibri line breaks match because Carlito uses the
same advance widths.

Document PDFs are rendered in-process with `@react-pdf/renderer` using these
files (`Font.register`). The optional `99-carlito-aliases.conf` documents the
fontconfig aliases previously used by the Chromium/Gotenberg renderer.
