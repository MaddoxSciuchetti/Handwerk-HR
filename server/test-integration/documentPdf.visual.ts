/**
 * Visual regression: native PDF vs Chromium golden rasters.
 * Run: DOCUMENT_FONT_DIR=./document-fonts npx tsx --require ./jest.setup.cjs --env-file=.env test-integration/documentPdf.visual.ts
 */
import { execFileSync } from "node:child_process";
import {
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { generateDocumentPdf } from "../src/services/documentPdf";

const goldensRoot = join(process.cwd(), "test-fixtures/pdf-goldens");
const outRoot = join(process.cwd(), "tmp/pdf-visual");
// Cross-engine (Chromium vs react-pdf) AA/hinting still moves ink by a few px.
// Page counts must match; pixel budget is after vertical baseline alignment.
const MAX_DIFF_RATIO = 0.14;

async function rasterize(pdfPath: string, outPrefix: string) {
  execFileSync(
    "pdftoppm",
    ["-png", "-r", "150", pdfPath, outPrefix],
    { stdio: "inherit" },
  );
}

function pageFiles(dir: string, prefix: string) {
  return readdir(dir).then((names) =>
    names
      .filter((n) => n.startsWith(prefix) && n.endsWith(".png"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
  );
}

/** First row with near-black ink — used to cancel small vertical chrome drift. */
function firstInkRow(png: PNG) {
  const { width, height, data } = png;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (width * y + x) << 2;
      if (data[i]! + data[i + 1]! + data[i + 2]! < 600) return y;
    }
  }
  return 0;
}

async function comparePng(aPath: string, bPath: string, diffPath: string) {
  const a = PNG.sync.read(await readFile(aPath));
  const b = PNG.sync.read(await readFile(bPath));
  const shift = firstInkRow(b) - firstInkRow(a);
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height) + Math.abs(shift);
  const aa = new PNG({ width, height, fill: true });
  const bb = new PNG({ width, height, fill: true });
  // Fill white
  aa.data.fill(255);
  bb.data.fill(255);
  const aTop = Math.max(0, -shift);
  const bTop = Math.max(0, shift);
  PNG.bitblt(a, aa, 0, 0, a.width, a.height, 0, aTop);
  PNG.bitblt(b, bb, 0, 0, b.width, b.height, 0, bTop);
  const diff = new PNG({ width, height });
  const mismatched = pixelmatch(aa.data, bb.data, diff.data, width, height, {
    threshold: 0.15,
    includeAA: true,
  });
  await writeFile(diffPath, PNG.sync.write(diff));
  return { mismatched, total: width * height, width, height, shift };
}

const ids = (await readdir(goldensRoot)).filter((name) => !name.startsWith("."));
const results: {
  id: string;
  pagesGolden: number;
  pagesNative: number;
  pageDiffs: { page: string; ratio: number; mismatched: number }[];
  ok: boolean;
}[] = [];

await rm(outRoot, { recursive: true, force: true });
await mkdir(outRoot, { recursive: true });

for (const id of ids) {
  const goldenDir = join(goldensRoot, id);
  const work = join(outRoot, id);
  const goldenRasterDir = join(work, "golden");
  await mkdir(work, { recursive: true });
  await mkdir(goldenRasterDir, { recursive: true });
  const input = JSON.parse(await readFile(join(goldenDir, "input.json"), "utf8"));
  const pdf = await generateDocumentPdf(input.document, input.values);
  const nativePdf = join(work, "native.pdf");
  await writeFile(nativePdf, pdf.bytes);
  await rasterize(nativePdf, join(work, "native"));
  // Rasterize committed chromium.pdf at compare time (avoid huge PNGs in git).
  await rasterize(join(goldenDir, "chromium.pdf"), join(goldenRasterDir, "page"));
  const goldenPages = await pageFiles(goldenRasterDir, "page");
  const nativePages = await pageFiles(work, "native");
  const pageDiffs: { page: string; ratio: number; mismatched: number }[] = [];
  const count = Math.max(goldenPages.length, nativePages.length);
  for (let i = 0; i < count; i++) {
    const gName = goldenPages[i];
    const nName = nativePages[i];
    if (!gName || !nName) {
      pageDiffs.push({
        page: String(i + 1),
        ratio: 1,
        mismatched: -1,
      });
      continue;
    }
    const cmp = await comparePng(
      join(goldenRasterDir, gName),
      join(work, nName),
      join(work, `diff-${i + 1}.png`),
    );
    pageDiffs.push({
      page: String(i + 1),
      ratio: cmp.mismatched / cmp.total,
      mismatched: cmp.mismatched,
    });
  }
  const ok =
    goldenPages.length === nativePages.length &&
    pageDiffs.every((d) => d.ratio <= MAX_DIFF_RATIO);
  results.push({
    id,
    pagesGolden: goldenPages.length,
    pagesNative: nativePages.length,
    pageDiffs,
    ok,
  });
}

console.log(JSON.stringify(results, null, 2));
if (results.some((r) => !r.ok)) {
  console.error("Visual regression failed. Inspect tmp/pdf-visual/*/diff-*.png");
  process.exit(1);
}
console.log("All goldens within visual tolerance.");
