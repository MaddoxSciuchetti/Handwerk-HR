/**
 * Visual regression: native PDF vs Chromium golden rasters.
 * Run: DOCUMENT_FONT_DIR=./document-fonts npx tsx --require ./jest.setup.cjs --env-file=.env test-integration/documentPdf.visual.ts
 */
import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { DOMParser } from "linkedom";
import { generateDocumentPdf } from "../src/services/documentPdf";

const goldensRoot = join(process.cwd(), "test-fixtures/pdf-goldens");
const outRoot = join(process.cwd(), "tmp/pdf-visual");
// Cross-engine (Chromium vs react-pdf) AA/hinting still moves ink by a few px.
// Absolute text geometry and pagination are checked BEFORE raster alignment.
const MAX_DIFF_RATIO = 0.14;

async function rasterize(pdfPath: string, outPrefix: string) {
  execFileSync("pdftoppm", ["-png", "-r", "150", pdfPath, outPrefix], {
    stdio: "inherit",
  });
}

function pageFiles(dir: string, prefix: string) {
  return readdir(dir).then((names) =>
    names
      .filter((n) => n.startsWith(prefix) && n.endsWith(".png"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
  );
}

type Anchor = { page: number; x: number; y: number };
function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

// Match unique five-word passages rather than counting the white page background.
// This catches missing text and page drift even when a sparse raster passes.
function textAnchors(path: string) {
  const xml = execFileSync("pdftotext", ["-bbox", path, "-"], {
    encoding: "utf8",
  });
  const parsed = new DOMParser().parseFromString(xml, "text/xml");
  const anchors = new Map<string, Anchor[]>();
  [...parsed.querySelectorAll("page")].forEach((page, pageIndex) => {
    const words = [...page.querySelectorAll("word")].flatMap((word) =>
      (word.textContent?.match(/[\p{L}\p{N}]+/gu) ?? []).map((text) => ({
        text,
        x: Number(word.getAttribute("xMin")),
        y: Number(word.getAttribute("yMin")),
      })),
    );
    for (let i = 0; i + 4 < words.length; i++) {
      const key = words
        .slice(i, i + 5)
        .map((word) => word.text)
        .join(" ");
      const first = words[i]!;
      const entries = anchors.get(key) ?? [];
      entries.push({ page: pageIndex, x: first.x, y: first.y });
      anchors.set(key, entries);
    }
  });
  return new Map(
    [...anchors]
      .filter(([, entries]) => entries.length === 1)
      .map(([key, entries]) => [key, entries[0]!]),
  );
}

function geometry(goldenPath: string, nativePath: string) {
  const golden = textAnchors(goldenPath);
  const native = textAnchors(nativePath);
  const matches = [...golden].flatMap(([key, a]) => {
    const b = native.get(key);
    return b ? [{ a, b }] : [];
  });
  const samePage = matches.filter(({ a, b }) => a.page === b.page);
  const pages = [...new Set(samePage.map(({ a }) => a.page))].map((page) => {
    const pairs = samePage.filter(({ a }) => a.page === page);
    return {
      page,
      medianDx: median(pairs.map(({ a, b }) => Math.abs(b.x - a.x))),
      medianDy: median(pairs.map(({ a, b }) => Math.abs(b.y - a.y))),
      xShift: Math.round(
        (median(pairs.map(({ a, b }) => b.x - a.x)) * 150) / 72,
      ),
      shift: Math.round(
        (median(pairs.map(({ a, b }) => b.y - a.y)) * 150) / 72,
      ),
    };
  });
  return {
    coverage: matches.length / Math.max(1, golden.size),
    samePageRatio: samePage.length / Math.max(1, matches.length),
    pages,
  };
}

async function comparePng(
  aPath: string,
  bPath: string,
  diffPath: string,
  shift: number,
  xShift: number,
) {
  const a = PNG.sync.read(await readFile(aPath));
  const b = PNG.sync.read(await readFile(bPath));
  const width = Math.max(a.width, b.width) + Math.abs(xShift);
  const height = Math.max(a.height, b.height) + Math.abs(shift);
  const aa = new PNG({ width, height, fill: true });
  const bb = new PNG({ width, height, fill: true });
  // Fill white
  aa.data.fill(255);
  bb.data.fill(255);
  const aTop = Math.max(0, shift);
  const bTop = Math.max(0, -shift);
  PNG.bitblt(a, aa, 0, 0, a.width, a.height, Math.max(0, xShift), aTop);
  PNG.bitblt(b, bb, 0, 0, b.width, b.height, Math.max(0, -xShift), bTop);
  const diff = new PNG({ width, height });
  const mismatched = pixelmatch(aa.data, bb.data, diff.data, width, height, {
    threshold: 0.15,
    includeAA: true,
  });
  await writeFile(diffPath, PNG.sync.write(diff));
  return { mismatched, total: width * height, width, height, shift };
}

const ids = (await readdir(goldensRoot)).filter(
  (name) => !name.startsWith("."),
);
const results: {
  id: string;
  pagesGolden: number;
  pagesNative: number;
  pageDiffs: { page: string; ratio: number; mismatched: number }[];
  geometry: ReturnType<typeof geometry>;
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
  const input = JSON.parse(
    await readFile(join(goldenDir, "input.json"), "utf8"),
  );
  const pdf = await generateDocumentPdf(input.document, input.values);
  const nativePdf = join(work, "native.pdf");
  await writeFile(nativePdf, pdf.bytes);
  await rasterize(nativePdf, join(work, "native"));
  // Rasterize committed chromium.pdf at compare time (avoid huge PNGs in git).
  await rasterize(
    join(goldenDir, "chromium.pdf"),
    join(goldenRasterDir, "page"),
  );
  const goldenPages = await pageFiles(goldenRasterDir, "page");
  const nativePages = await pageFiles(work, "native");
  const layout = geometry(join(goldenDir, "chromium.pdf"), nativePdf);
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
      layout.pages.find((page) => page.page === i)?.shift ?? 0,
      layout.pages.find((page) => page.page === i)?.xShift ?? 0,
    );
    pageDiffs.push({
      page: String(i + 1),
      ratio: cmp.mismatched / cmp.total,
      mismatched: cmp.mismatched,
    });
  }
  const ok =
    layout.coverage >= 0.85 &&
    layout.samePageRatio >= 0.99 &&
    layout.pages.every((page) => page.medianDx <= 4 && page.medianDy <= 10) &&
    goldenPages.length === nativePages.length &&
    pageDiffs.every((d) => d.ratio <= MAX_DIFF_RATIO);
  results.push({
    id,
    pagesGolden: goldenPages.length,
    pagesNative: nativePages.length,
    pageDiffs,
    geometry: layout,
    ok,
  });
}

console.log(JSON.stringify(results, null, 2));
if (results.some((r) => !r.ok)) {
  console.error(
    "Visual regression failed. Inspect tmp/pdf-visual/*/diff-*.png",
  );
  process.exit(1);
}
console.log("All goldens within visual tolerance.");
