import JSZip from "jszip";
import { DOMParser } from "linkedom";
import { FONT_FAMILIES } from "../../../shared/documentRendering";
import type { DocumentNode, StyledDocument } from "../../../shared/document";

const children = (node: Element | undefined, name: string): Element[] =>
  node
    ? Array.from(node.children).filter(
        (child) => child.localName.split(":").at(-1) === name,
      )
    : [];
const child = (node: Element | undefined, name: string) =>
  children(node, name)[0];
const attr = (node: Element | undefined, name = "val") =>
  node?.getAttribute("w:" + name) ?? undefined;
const descendants = (node: Element, name: string) =>
  Array.from(node.getElementsByTagName("w:" + name));
const normalized = (text: string) =>
  text.normalize("NFKC").replace(/[☐☒☑]/g, "").replace(/\s+/g, "").trim();
type Props = Record<string, string | number | boolean>;

async function readXml(zip: JSZip, name: string): Promise<string | undefined> {
  const entry = zip.file(name);
  if (!entry) return undefined;
  const stream = entry.nodeStream("nodebuffer");
  let size = 0;
  const chunks: Uint8Array[] = [];
  await new Promise<void>((resolve, reject) => {
    stream
      .on("data", (chunk) => {
        size += chunk.length;
        if (size > 10_000_000) {
          stream.pause();
          reject(new Error("Word-XML ist zu groß."));
        } else chunks.push(chunk);
      })
      .on("error", reject)
      .on("end", resolve);
  });
  const xml = Buffer.concat(chunks).toString("utf8");
  if (/<!DOCTYPE|<!ENTITY/i.test(xml))
    throw new Error("Nicht unterstützte Word-XML-Deklaration.");
  return xml;
}

// Import the first header as an editable header, without fetching external
// relationships. Section-specific header variants still require manual review.
export async function docxHeaderBuffer(
  buffer: Buffer,
  part: "header" | "footer" = "header",
): Promise<Buffer | undefined> {
  const zip = await JSZip.loadAsync(buffer);
  const name = Object.keys(zip.files)
    .filter((name) => new RegExp("^word/" + part + "\\d+\\.xml$").test(name))
    .sort()[0];
  if (!name) return undefined;
  const xml = await readXml(zip, name);
  const tag = part === "header" ? "hdr" : "ftr";
  const match = xml?.match(
    new RegExp("<w:" + tag + "\\b([^>]*)>([\\s\\S]*)</w:" + tag + ">"),
  );
  if (!match) return undefined;
  zip.file(
    "word/document.xml",
    "<w:document" +
      match[1] +
      "><w:body>" +
      match[2] +
      "</w:body></w:document>",
  );
  const relationships = await readXml(
    zip,
    "word/_rels/" + name.split("/").at(-1) + ".rels",
  );
  zip.file(
    "word/_rels/document.xml.rels",
    relationships ??
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>',
  );
  return zip.generateAsync({ type: "nodebuffer" });
}

function properties(node: Element | undefined): Props {
  const result: Props = {};
  const size = Number(attr(child(node, "sz")));
  if (size >= 8 && size <= 144) result.fontSize = size / 2;
  const fonts = child(node, "rFonts");
  const family = attr(fonts, "ascii") ?? attr(fonts, "hAnsi");
  if (FONT_FAMILIES.includes(family as (typeof FONT_FAMILIES)[number]))
    result.fontFamily = family!;
  const color = attr(child(node, "color"));
  if (color && /^[0-9a-f]{6}$/i.test(color))
    result.color = "#" + color.toLowerCase();
  for (const [source, target] of [
    ["b", "bold"],
    ["i", "italic"],
    ["u", "underline"],
    ["strike", "strike"],
  ]) {
    const element = child(node, source);
    if (element)
      result[target] = !["0", "false", "off", "none"].includes(
        attr(element) ?? "1",
      );
  }
  const alignment = attr(child(node, "jc"));
  if (["left", "center", "right", "both", "justify"].includes(alignment ?? ""))
    result.textAlign = alignment === "both" ? "justify" : alignment!;
  const spacing = child(node, "spacing");
  for (const [source, target] of [
    ["before", "marginTop"],
    ["after", "marginBottom"],
  ]) {
    const value = attr(spacing, source);
    if (value !== undefined && Number(value) >= 0 && Number(value) <= 4000)
      result[target] = Number(value) / 20;
  }
  const line = attr(spacing, "line");
  if (
    line &&
    (!attr(spacing, "lineRule") || attr(spacing, "lineRule") === "auto")
  )
    result.lineHeight = Math.min(10, Math.max(0.5, Number(line) / 240));
  const indent = child(node, "ind");
  for (const [source, target] of [
    ["left", "marginLeft"],
    ["right", "marginRight"],
  ]) {
    const value = attr(indent, source);
    if (value !== undefined && Number(value) >= 0 && Number(value) <= 12000)
      result[target] = Math.min(200, Number(value) / 20);
  }
  const firstLine = attr(indent, "firstLine");
  const hanging = attr(indent, "hanging");
  if (firstLine !== undefined && Math.abs(Number(firstLine)) <= 4000)
    result.textIndent = Number(firstLine) / 20;
  else if (
    hanging !== undefined &&
    Number(hanging) >= 0 &&
    Number(hanging) <= 4000
  )
    result.textIndent = -Number(hanging) / 20;
  return result;
}

type ImportedLine = {
  left: number;
  top: number;
  width: number;
  thickness: number;
  color: string;
};

type ImportedLabel = {
  left: number;
  top: number;
  text: string;
  fontFamily?: string;
  fontSize: number;
  color: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  centered?: boolean;
  runs?: { text: string; props: Props }[];
};

const estimatedTextWidth = (text: string, size: number) =>
  Array.from(text).reduce(
    (width, character) =>
      width +
      size *
        (character === " " ? 0.28 : /[ilI.,()]/.test(character) ? 0.28 : 0.5),
    0,
  );

// Tab-stop definitions live in w:tabs and use the same w:tab tag as a tab
// character. Only characters inside runs move the cursor.
function tabCharacters(paragraph: Element): Element[] {
  return descendants(paragraph, "r").flatMap((run) =>
    Array.from(run.children).filter(
      (part) => part.localName.split(":").at(-1) === "tab",
    ),
  );
}

function hasTextAfterTab(paragraph: Element): boolean {
  const parts = descendants(paragraph, "r").flatMap((run) =>
    Array.from(run.children),
  );
  return parts.some(
    (part, index) =>
      part.localName.split(":").at(-1) === "tab" &&
      parts
        .slice(index + 1)
        .some(
          (following) =>
            following.localName.split(":").at(-1) === "t" &&
            following.textContent?.trim(),
        ),
  );
}

// A tab character aimed past the right margin wraps the following text in
// Word. A tab stop with no tab character does not. Signature rows are exempt
// because their tabs are underlined on purpose.
function wrapsAtMargin(paragraph: Element): boolean {
  if (!tabCharacters(paragraph).length) return false;
  const stops = children(child(child(paragraph, "pPr"), "tabs"), "tab").map(
    (tab) => Number(attr(tab, "pos")) / 20,
  );
  const underlined = descendants(paragraph, "r").some(
    (run) =>
      properties(child(run, "rPr")).underline === true &&
      Array.from(run.children).some(
        (part) => part.localName.split(":").at(-1) === "tab",
      ),
  );
  return (
    !underlined &&
    hasTextAfterTab(paragraph) &&
    stops.some((stop) => stop > 430)
  );
}

function tabLayout(
  paragraph: Element,
  paragraphProps: Props,
  defaultRun: Props,
): { lines: ImportedLine[]; labels: ImportedLabel[]; height: number } | null {
  const pPr = child(paragraph, "pPr");
  const stops = children(child(pPr, "tabs"), "tab")
    .map((tab) => Number(attr(tab, "pos")) / 20)
    .filter((value) => Number.isFinite(value) && value >= 0 && value <= 2000);
  const signatureCaption = descendants(paragraph, "t")
    .map((part) => part.textContent ?? "")
    .join("")
    .match(/^(?:\s*\((?:Ort|Datum|Arbeitgeber|Arbeitnehmer)\)\s*)+$/);
  if ((!stops.length || !tabCharacters(paragraph).length) && !signatureCaption)
    return null;
  if (wrapsAtMargin(paragraph) && !signatureCaption) return null;
  // A centered line whose tab only jumps toward the right margin wraps in Word.
  // Signature rows are the centered lines that actually underline their tabs.
  if (paragraphProps.textAlign === "center") {
    const underlined = descendants(paragraph, "r").some(
      (run) =>
        properties(child(run, "rPr")).underline === true &&
        children(run, "tab").length > 0,
    );
    if (!underlined && !signatureCaption) return null;
  }

  if (
    !hasTextAfterTab(paragraph) &&
    !descendants(paragraph, "r").some(
      (run) =>
        properties(child(run, "rPr")).underline === true &&
        children(run, "tab").length > 0,
    ) &&
    !signatureCaption
  )
    return null;

  const paragraphLeft = Number(paragraphProps.marginLeft) || 0;
  const lines: ImportedLine[] = [];
  const labels: ImportedLabel[] = [];
  let cursor = 0;
  let stopIndex = 0;
  let pending = "";
  let pendingRuns: { text: string; props: Props }[] = [];
  let pendingLeft = 0;
  let pendingProps: Props = defaultRun;

  const flush = () => {
    if (!pending) return;
    const size =
      Number(pendingProps.fontSize) || Number(defaultRun.fontSize) || 11;
    labels.push({
      left: pendingLeft,
      top: 0,
      text: pending,
      runs: pendingRuns,
      fontFamily:
        typeof pendingProps.fontFamily === "string"
          ? pendingProps.fontFamily
          : undefined,
      fontSize: size,
      color:
        typeof pendingProps.color === "string" ? pendingProps.color : "#000000",
      bold: pendingProps.bold === true || undefined,
      italic: pendingProps.italic === true || undefined,
      underline: pendingProps.underline === true || undefined,
    });
    cursor += pendingRuns.reduce(
      (width, run) =>
        width +
        estimatedTextWidth(run.text, Number(run.props.fontSize) || size),
      0,
    );
    pending = "";
    pendingRuns = [];
  };

  for (const run of descendants(paragraph, "r")) {
    const runProps = { ...defaultRun, ...properties(child(run, "rPr")) };
    for (const part of Array.from(run.children)) {
      const tag = part.localName.split(":").at(-1);
      if (tag === "t") {
        if (!pending) {
          pendingLeft = cursor;
          pendingProps = runProps;
        }
        pending += part.textContent ?? "";
        pendingRuns.push({ text: part.textContent ?? "", props: runProps });
      } else if (tag === "tab") {
        flush();
        while (
          stopIndex < stops.length &&
          stops[stopIndex] - paragraphLeft <= cursor + 0.25
        )
          stopIndex += 1;
        const target = Math.max(
          cursor,
          (stops[stopIndex] ?? paragraphLeft + cursor + 36) - paragraphLeft,
        );
        stopIndex += 1;
        if (runProps.underline === true && target > cursor)
          lines.push({
            left: cursor,
            top: (Number(runProps.fontSize) || 11) * 1.05,
            width: target - cursor,
            thickness: 0.5,
            color:
              typeof runProps.color === "string" ? runProps.color : "#000000",
          });
        cursor = target;
      }
    }
  }
  flush();
  const maxSize = Math.max(
    Number(defaultRun.fontSize) || 11,
    ...labels.map((label) => label.fontSize),
  );
  return { lines, labels, height: maxSize * 1.35 };
}

// Pages writes "Zwischen" at the left margin and the company name centered on
// the same line by inserting a wide run of spaces. A full-width rule is not
// part of that line; an underline belongs under the company name only.
function captionLine(
  paragraph: Element,
  contentWidth: number,
  defaultRun: Props,
): { lines: ImportedLine[]; labels: ImportedLabel[]; height: number } | null {
  if (tabCharacters(paragraph).length) return null;
  const runs = descendants(paragraph, "r").flatMap((run) => {
    const text = Array.from(run.children)
      .filter((part) => part.localName.split(":").at(-1) === "t")
      .map((part) => part.textContent ?? "")
      .join("");
    if (!text) return [];
    return [{ text, props: properties(child(run, "rPr")) }];
  });
  // Word may split the whitespace across runs or keep it with the caption.
  const joined = runs.map((run) => run.text).join("");
  const gap = / {8,}/.exec(joined);
  if (!gap) return null;
  const caption = joined.slice(0, gap.index).trim();
  const subject = joined.slice(gap.index + gap[0].length).trim();
  if (!caption || caption.length > 24 || !subject || subject.length > 80)
    return null;
  let offset = 0;
  const subjectRun = runs.find((run) => {
    offset += run.text.length;
    return offset > gap.index + gap[0].length && run.text.trim();
  });
  const subjectProps = { ...defaultRun, ...subjectRun?.props };
  const size =
    Number(subjectProps.fontSize) || Number(defaultRun.fontSize) || 11;
  const captionProps = { ...defaultRun, ...runs[0].props };
  const captionSize =
    Number(captionProps.fontSize) || Number(defaultRun.fontSize) || size;
  return {
    lines: [],
    labels: [
      {
        left: 0,
        top: 0,
        text: caption,
        fontSize: captionSize,
        color:
          typeof captionProps.color === "string"
            ? captionProps.color
            : "#000000",
        fontFamily:
          typeof captionProps.fontFamily === "string"
            ? captionProps.fontFamily
            : undefined,
        bold: captionProps.bold === true || undefined,
      },
      {
        left: contentWidth / 2,
        centered: true,
        top: 0,
        text: subject,
        fontSize: size,
        color:
          typeof subjectProps.color === "string"
            ? subjectProps.color
            : "#000000",
        fontFamily:
          typeof subjectProps.fontFamily === "string"
            ? subjectProps.fontFamily
            : undefined,
        bold: subjectProps.bold === true || undefined,
        underline: subjectProps.underline === true || undefined,
      },
    ],
    height: Math.max(size, captionSize) * 1.45,
  };
}

function anchoredLines(paragraph: Element): ImportedLine[] {
  return Array.from(paragraph.getElementsByTagName("wp:anchor")).flatMap(
    (anchor) => {
      const geometry = child(child(anchor, "graphic"), "graphicData");
      const preset = geometry
        ? Array.from(geometry.getElementsByTagName("a:prstGeom"))[0]
        : undefined;
      const custom = geometry
        ? Array.from(geometry.getElementsByTagName("a:custGeom"))[0]
        : undefined;
      const thinCustomLine =
        custom &&
        custom.getElementsByTagName("a:moveTo").length === 1 &&
        custom.getElementsByTagName("a:lnTo").length === 1 &&
        Number(child(anchor, "extent")?.getAttribute("cy")) <= 12700;
      if (preset?.getAttribute("prst") !== "line" && !thinCustomLine) return [];
      const horizontal = child(anchor, "positionH");
      const vertical = child(anchor, "positionV");
      const extent = child(anchor, "extent");
      const line = geometry
        ? Array.from(geometry.getElementsByTagName("a:ln"))[0]
        : undefined;
      const rgb = geometry
        ? Array.from(
            geometry.getElementsByTagName("a:srgbClr"),
          )[0]?.getAttribute("val")
        : undefined;
      const left = Number(child(horizontal, "posOffset")?.textContent) / 12700;
      const top = Number(child(vertical, "posOffset")?.textContent) / 12700;
      const width = Number(extent?.getAttribute("cx")) / 12700;
      const thickness = Number(line?.getAttribute("w")) / 12700;
      if (
        ![left, top, width, thickness].every(Number.isFinite) ||
        width <= 0 ||
        width > 2000 ||
        Math.abs(left) > 2000 ||
        Math.abs(top) > 2000
      )
        return [];
      return [
        {
          left,
          top,
          width,
          thickness: Math.max(0.25, Math.min(10, thickness || 0.5)),
          color: rgb && /^[0-9a-f]{6}$/i.test(rgb) ? "#" + rgb : "#000000",
        },
      ];
    },
  );
}

// Inline rules participate in the paragraph's tab flow, unlike anchored rules.
function inlineLines(paragraph: Element): ImportedLine[] {
  const props = properties(child(paragraph, "pPr"));
  let cursor = Number(props.marginLeft) || 0;
  const stops = children(child(child(paragraph, "pPr"), "tabs"), "tab").map(
    (tab) => Number(attr(tab, "pos")) / 20,
  );
  const lines: ImportedLine[] = [];
  for (const run of descendants(paragraph, "r")) {
    for (const part of Array.from(run.children)) {
      if (part.localName.split(":").at(-1) === "tab")
        cursor = stops.find((stop) => stop > cursor) ?? cursor + 36;
      for (const drawing of Array.from(
        part.getElementsByTagName("wp:inline"),
      )) {
        const extent = child(drawing, "extent");
        const custom = drawing.getElementsByTagName("a:custGeom")[0];
        if (
          !custom ||
          custom.getElementsByTagName("a:moveTo").length !== 1 ||
          custom.getElementsByTagName("a:lnTo").length !== 1 ||
          Number(extent?.getAttribute("cy")) > 12700
        )
          continue;
        const width = Number(extent?.getAttribute("cx")) / 12700;
        if (!(width > 0 && width < 2000)) continue;
        lines.push({
          left: cursor,
          top: 8.4,
          width,
          thickness: 0.5,
          color: "#000000",
        });
        cursor += width;
      }
    }
  }
  return lines;
}

// Mammoth supplies semantic lists/tables/images. Overlay OOXML's actual run and
// paragraph styles; Mammoth intentionally discards visual formatting by default.
export async function restoreDocxStyles(
  buffer: Buffer,
  document: StyledDocument,
): Promise<void> {
  const zip = await JSZip.loadAsync(buffer);
  const read = async (name: string) => {
    const xml = await readXml(zip, name);
    if (!xml) return undefined;
    return new DOMParser().parseFromString(xml, "text/xml")
      .documentElement as unknown as Element;
  };
  const root = await read("word/document.xml");
  if (!root) return;
  const stylesXml = await read("word/styles.xml");
  const styles = new Map(
    (stylesXml ? descendants(stylesXml, "style") : []).map((style) => [
      attr(style, "styleId"),
      style,
    ]),
  );
  const defaultParagraphStyleId =
    [...styles.values()]
      .find(
        (style) =>
          attr(style, "type") === "paragraph" &&
          ["1", "true"].includes(attr(style, "default") ?? ""),
      )
      ?.getAttribute("w:styleId") ?? undefined;
  const defaults = child(stylesXml, "docDefaults");
  const defaultRun = properties(child(child(defaults, "rPrDefault"), "rPr"));
  const defaultParagraph = properties(
    child(child(defaults, "pPrDefault"), "pPr"),
  );
  const resolveStyle = (
    id: string | undefined,
    seen = new Set<string>(),
  ): { run: Props; paragraph: Props } => {
    if (!id || seen.has(id) || seen.size > 20)
      return { run: {}, paragraph: {} };
    seen.add(id);
    const style = styles.get(id);
    const base = resolveStyle(attr(child(style, "basedOn")), seen);
    return {
      run: { ...base.run, ...properties(child(style, "rPr")) },
      paragraph: {
        ...base.paragraph,
        ...properties(child(style, "pPr")),
      },
    };
  };
  const source = descendants(root, "p").map((paragraph) => ({
    paragraph,
    bodyParagraph:
      paragraph.parentElement?.localName.split(":").at(-1) === "body",
    text: descendants(paragraph, "t")
      .map((text) => text.textContent ?? "")
      .join(""),
    // Mammoth omits fldSimple results, whereas complex fields retain theirs.
    textWithoutSimpleFields: descendants(paragraph, "t")
      .filter((text) => {
        let ancestor = text.parentElement;
        while (ancestor && ancestor !== paragraph) {
          if (
            ancestor.localName.split(":").at(-1) === "fldSimple" &&
            /^(PAGE|NUMPAGES)\b/i.test((attr(ancestor, "instr") ?? "").trim())
          )
            return false;
          ancestor = ancestor.parentElement;
        }
        return true;
      })
      .map((text) => text.textContent ?? "")
      .join(""),
  }));
  const renderedBreakOffsets = new Map<Element, number[]>();
  for (const { paragraph } of source) {
    let offset = 0;
    const offsets: number[] = [];
    for (const run of descendants(paragraph, "r"))
      for (const part of Array.from(run.children)) {
        const tag = part.localName.split(":").at(-1);
        if (tag === "t") offset += (part.textContent ?? "").length;
        else if (tag === "lastRenderedPageBreak") offsets.push(offset);
      }
    if (offsets.length) renderedBreakOffsets.set(paragraph, offsets);
  }
  const inlineRenderedBreaks = new WeakMap<DocumentNode, number[]>();
  const sectionBreaks = source.flatMap(({ paragraph }, index) => {
    const section = child(child(paragraph, "pPr"), "sectPr");
    const explicitPageBreak = descendants(paragraph, "br").some(
      (br) => attr(br, "type") === "page",
    );
    const paragraphPageBreak = child(
      child(paragraph, "pPr"),
      "pageBreakBefore",
    );
    if (renderedBreakOffsets.get(paragraph)?.includes(0)) return [index];
    return explicitPageBreak ||
      paragraphPageBreak ||
      (section && attr(child(section, "type")) !== "continuous")
      ? [index + 1]
      : [];
  });
  const breakBefore = new WeakSet<DocumentNode>();
  let consumedSectionBreak = -1;
  const numberingXml = await read("word/numbering.xml");
  type ListInfo = {
    id: string;
    level: number;
    format: string;
    number: number;
    color?: string;
    fontSize?: number;
    paddingLeft?: number;
    listStyleType?: string;
  };
  const lists = new WeakMap<DocumentNode, ListInfo>();
  const sourceIndices = new WeakMap<DocumentNode, number>();
  const counters = new Map<string, number>();
  const startedLists = new Set<string>();
  const numbering = new Map(
    (numberingXml ? children(numberingXml, "num") : []).map((num) => [
      attr(num, "numId"),
      num,
    ]),
  );
  const definitions = new Map(
    (numberingXml ? children(numberingXml, "abstractNum") : []).map((num) => [
      attr(num, "abstractNumId"),
      num,
    ]),
  );
  const levelDefinition = (
    id: string,
    level: number,
    seen = new Set<string>(),
  ): Props => {
    if (seen.has(id) || seen.size > 20) return {};
    seen.add(id);
    const num = numbering.get(id);
    const definition = definitions.get(attr(child(num, "abstractNumId")));
    const linkedStyle = styles.get(attr(child(definition, "numStyleLink")));
    const linkedId = attr(
      child(child(child(linkedStyle, "pPr"), "numPr"), "numId"),
    );
    const inherited = linkedId ? levelDefinition(linkedId, level, seen) : {};
    const override = children(num, "lvlOverride").find(
      (item) => Number(attr(item, "ilvl")) === level,
    );
    const base = children(definition, "lvl").find(
      (item) => Number(attr(item, "ilvl")) === level,
    );
    const direct = child(override, "lvl");
    const format = attr(child(direct, "numFmt")) ?? attr(child(base, "numFmt"));
    const marker =
      attr(child(direct, "lvlText")) ?? attr(child(base, "lvlText"));
    // A copied level inside an override repeats the abstract start. Only an
    // explicit startOverride begins the list at a new number.
    const startOverride = attr(child(override, "startOverride"));
    const start = startOverride ?? attr(child(base, "start"));
    const indent =
      attr(child(child(direct, "pPr"), "ind"), "left") ??
      attr(child(child(base, "pPr"), "ind"), "left");
    return {
      ...inherited,
      ...properties(child(base, "rPr")),
      ...properties(child(direct, "rPr")),
      ...(format ? { format } : {}),
      ...(marker !== undefined ? { marker } : {}),
      ...(start !== undefined ? { start: Number(start) } : {}),
      ...(startOverride !== undefined
        ? { startOverride: Number(startOverride) }
        : {}),
      abstractId: attr(child(num, "abstractNumId")) ?? id,
      ...(indent !== undefined ? { paddingLeft: Number(indent) / 20 } : {}),
    };
  };
  const sourceLists = source.map(
    ({ paragraph, text }): ListInfo | undefined => {
      let pPr = child(paragraph, "pPr");
      let numPr = child(pPr, "numPr");
      let styleId = attr(child(pPr, "pStyle"));
      const seen = new Set<string>();
      while (!numPr && styleId && !seen.has(styleId)) {
        seen.add(styleId);
        const style = styles.get(styleId);
        numPr = child(child(style, "pPr"), "numPr");
        styleId = attr(child(style, "basedOn"));
      }
      const id = attr(child(numPr, "numId"));
      if (!id || id === "0") return undefined;
      const level = Math.min(
        8,
        Math.max(0, Number(attr(child(numPr, "ilvl"))) || 0),
      );
      const props = levelDefinition(id, level);
      const format = String(props.format ?? "none");
      // Lists that share an abstract definition are one sequence in Word.
      // startOverride is the only mark that begins that sequence again.
      const key = String(props.abstractId ?? id) + ":" + level + ":" + format;
      const instance = id + ":" + level;
      if (
        !startedLists.has(instance) &&
        typeof props.startOverride === "number"
      )
        counters.set(key, props.startOverride);
      startedLists.add(instance);
      const start = Number(props.start) || 1;
      const number = counters.get(key) ?? start;
      if (text.trim() && format !== "none") counters.set(key, number + 1);
      const indent = Number(props.paddingLeft);
      return {
        id,
        level,
        format,
        number,
        ...(typeof props.color === "string" ? { color: props.color } : {}),
        ...(typeof props.fontSize === "number"
          ? { fontSize: props.fontSize }
          : {}),
        ...(indent > 0 && indent <= 200 ? { paddingLeft: indent } : {}),
        ...(format === "bullet"
          ? {
              listStyleType:
                props.marker === "-"
                  ? "dash"
                  : props.marker === "o"
                    ? "circle"
                    : "disc",
            }
          : {}),
      };
    },
  );
  const sectionProps = descendants(root, "sectPr").at(-1);
  const pageWidthPt =
    Number(attr(child(sectionProps, "pgSz"), "w")) / 20 || (210 * 72) / 25.4;
  const marginLeftPtEarly =
    Number(attr(child(sectionProps, "pgMar"), "left")) / 20 || (20 * 72) / 25.4;
  const marginRightPtEarly =
    Number(attr(child(sectionProps, "pgMar"), "right")) / 20 ||
    marginLeftPtEarly;
  const contentWidth = Math.max(
    120,
    pageWidthPt - marginLeftPtEarly - marginRightPtEarly,
  );
  let cursor = 0;
  const imageWidths = Array.from(root.getElementsByTagName("wp:extent")).map(
    (extent) => Number(extent.getAttribute("cx")) / 9525,
  );
  let imageIndex = 0;
  const plain = (node: DocumentNode): string =>
    node.type === "lineGroup"
      ? ((node.attrs?.labels ?? []) as ImportedLabel[])
          .map((label) => label.text)
          .join("")
      : (node.text ?? (node.content ?? []).map(plain).join(""));
  const consumedInlineRules = new Set<Element>();
  const apply = (node: DocumentNode) => {
    if (node.type === "image") {
      const width = imageWidths[imageIndex++];
      if (Number.isFinite(width) && width > 0 && width <= 2000)
        node.attrs = { ...node.attrs, width };
    }
    if (["paragraph", "heading"].includes(node.type)) {
      const text = normalized(plain(node));
      const at = text
        ? source.findIndex(
            (candidate, index) =>
              index >= cursor &&
              (normalized(candidate.text) === text ||
                normalized(candidate.textWithoutSimpleFields) === text),
          )
        : -1;
      if (at >= 0) {
        cursor = at + 1;
        sourceIndices.set(node, at);
        const breaks = sectionBreaks.filter(
          (index) => index <= at && index > consumedSectionBreak,
        );
        if (breaks.length) {
          breakBefore.add(node);
          consumedSectionBreak = breaks.at(-1)!;
        }
        const paragraph = source[at].paragraph;
        const cachedOffsets = renderedBreakOffsets
          .get(paragraph)
          ?.filter((offset) => offset > 0);
        if (cachedOffsets?.length)
          inlineRenderedBreaks.set(node, cachedOffsets);
        if (sourceLists[at]) lists.set(node, sourceLists[at]!);
        const pPr = child(paragraph, "pPr");
        const style = resolveStyle(
          attr(child(pPr, "pStyle")) ?? defaultParagraphStyleId,
        );
        node.attrs = {
          ...node.attrs,
          ...defaultParagraph,
          ...style.paragraph,
          ...properties(pPr),
          ...(wrapsAtMargin(paragraph) ? { textAlign: "center" } : {}),
        };
        if (node.attrs.textAlign === "center") {
          // Keep the source heading's narrow text measure while centering it
          // on the paper. This matters for multi-line annex subtitles.
          const inset =
            node.type === "heading" ? Number(node.attrs.marginRight) || 0 : 0;
          node.attrs = {
            ...node.attrs,
            marginLeft: inset,
            marginRight: inset,
            textIndent: 0,
          };
        }
        const positionedTabs = tabLayout(paragraph, node.attrs as Props, {
          ...defaultRun,
          ...style.run,
          ...properties(child(pPr, "rPr")),
        });
        if (positionedTabs) {
          if (positionedTabs.lines.length) {
            const inlineParagraph = source[at + 1]?.paragraph;
            const inline = inlineParagraph ? inlineLines(inlineParagraph) : [];
            if (inline.length) {
              positionedTabs.lines.push(
                ...inline.map((line) => ({
                  ...line,
                  left: line.left - (Number(node.attrs.marginLeft) || 0),
                })),
              );
              consumedInlineRules.add(inlineParagraph);
            }
          }
          if (positionedTabs.lines.length) {
            const offset = Number(node.attrs.marginLeft) || 0;
            positionedTabs.lines.forEach((line) => {
              line.left += offset;
            });
            positionedTabs.labels.forEach((label) => {
              label.left += offset;
            });
          }
          // Choice rows use the same left edge as their plain checkbox
          // siblings, even when the row also includes an underlined date tab.
          const firstChoice = positionedTabs.labels[0];
          if (firstChoice && /^[☐☒☑]/.test(firstChoice.text.trimStart()))
            firstChoice.left = 0;
          const isSignatureCaption = positionedTabs.labels.every((label) =>
            /^\((?:Ort|Datum|Arbeitgeber|Arbeitnehmer)\)$/.test(
              label.text.trim(),
            ),
          );
          if (isSignatureCaption) {
            const pageMargin = (document.page.marginLeft * 72) / 25.4;
            const signatureLines = source
              .slice(Math.max(0, at - 3), at)
              .reverse()
              .map(({ paragraph: previous }) => {
                const drawn = anchoredLines(previous);
                if (drawn.length)
                  return drawn.map((line) => ({
                    ...line,
                    left: line.left - pageMargin,
                  }));
                const props = properties(child(previous, "pPr"));
                const tabs = tabLayout(previous, props, {
                  ...defaultRun,
                  ...style.run,
                });
                const next =
                  source[
                    source.findIndex((item) => item.paragraph === previous) + 1
                  ]?.paragraph;
                const inline = next ? inlineLines(next) : [];
                return [
                  ...(tabs?.lines ?? []).map((line) => ({
                    ...line,
                    left: line.left + (Number(props.marginLeft) || 0),
                  })),
                  ...inline,
                ].sort((a, b) => a.left - b.left);
              })
              .find((lines) => lines.length === positionedTabs.labels.length);
            if (signatureLines)
              positionedTabs.labels.forEach((label, index) => {
                const line = signatureLines[index];
                label.left = line.left + line.width / 2;
                label.centered = true;
              });
          }
          node.type = "lineGroup";
          node.attrs = {
            ...positionedTabs,
            marginLeft: 0,
            marginTop: Number(node.attrs.marginTop) || 0,
            marginBottom: Number(node.attrs.marginBottom) || 0,
            pageRelative: false,
          };
          delete node.content;
          return;
        }
        // Plain checkbox choices share the left edge with positioned checkbox
        // rows; they are not a second, indented list level.
        const sourceText = descendants(paragraph, "t")
          .map((part) => part.textContent ?? "")
          .join("")
          .trimStart();
        if (/^[☐☒☑]/.test(sourceText) && node.attrs.textAlign !== "center") {
          node.attrs = { ...node.attrs, marginLeft: 0, textIndent: 0 };
        }
        const caption = captionLine(paragraph, contentWidth, {
          ...defaultRun,
          ...style.run,
          ...properties(child(pPr, "rPr")),
        });
        if (caption) {
          node.type = "lineGroup";
          node.attrs = {
            ...caption,
            marginTop: Number(node.attrs.marginTop) || 0,
            marginBottom: Number(node.attrs.marginBottom) || 0,
            pageRelative: false,
          };
          delete node.content;
          return;
        }
        // Preserve embedded images and other semantic inline nodes.
        if (
          !node.content?.some(
            (item) => item.type !== "text" && item.type !== "hardBreak",
          )
        ) {
          const content: DocumentNode[] = [];
          let field:
            | { instr: string; result: boolean; cached: DocumentNode[] }
            | undefined;
          const simpleFields = new Set<Element>();
          for (const run of descendants(paragraph, "r")) {
            const simple =
              run.parentElement?.localName.split(":").at(-1) === "fldSimple"
                ? run.parentElement
                : undefined;
            const simpleKind =
              simple &&
              /^(PAGE|NUMPAGES)\b/i.exec(
                (attr(simple, "instr") ?? "").trim(),
              )?.[1];
            if (simple && simpleKind) {
              if (!simpleFields.has(simple))
                content.push({
                  type: "pageField",
                  attrs: {
                    kind:
                      simpleKind.toUpperCase() === "PAGE" ? "page" : "pages",
                  },
                });
              simpleFields.add(simple);
              continue;
            }
            const rPr = child(run, "rPr");
            const props = {
              ...defaultRun,
              ...style.run,
              ...resolveStyle(attr(child(rPr, "rStyle"))).run,
              ...properties(rPr),
            };
            const marks: NonNullable<DocumentNode["marks"]> = [];
            const visual = Object.fromEntries(
              Object.entries(props).filter(([key]) =>
                ["fontFamily", "fontSize", "color"].includes(key),
              ),
            );
            if (Object.keys(visual).length)
              marks.push({
                type: "textStyle",
                attrs: visual,
              });
            for (const key of ["bold", "italic", "underline", "strike"])
              if (props[key])
                marks.push(
                  key === "underline" && attr(child(rPr, "u")) === "double"
                    ? { type: key, attrs: { variant: "double" } }
                    : { type: key },
                );
            for (const part of Array.from(run.children)) {
              const tag = part.localName.split(":").at(-1);
              if (tag === "fldChar") {
                const kind = attr(part, "fldCharType");
                if (kind === "begin")
                  field = { instr: "", result: false, cached: [] };
                else if (kind === "separate" && field) field.result = true;
                else if (kind === "end" && field) {
                  const instr = field.instr.toUpperCase();
                  const pageKind = /\bNUMPAGES\b/.test(instr)
                    ? "pages"
                    : /\bPAGE\b/.test(instr)
                      ? "page"
                      : undefined;
                  const cached = field.cached;
                  field = undefined;
                  if (!pageKind) content.push(...cached);
                  if (pageKind)
                    content.push({
                      type: "pageField",
                      attrs: { kind: pageKind },
                      marks: cached[0]?.marks ?? marks,
                    });
                }
                continue;
              }
              if (tag === "instrText") {
                if (field && !field.result)
                  field.instr += part.textContent ?? "";
                continue;
              }
              if (field?.result) {
                if (tag === "t" && part.textContent)
                  field.cached.push({
                    type: "text",
                    text: part.textContent,
                    marks,
                  });
                else if (tag === "br" || tag === "cr")
                  field.cached.push({ type: "hardBreak" });
                continue;
              }
              if (tag === "t" && part.textContent)
                content.push({
                  type: "text",
                  text: part.textContent,
                  marks,
                });
              else if (tag === "tab")
                content.push(
                  node.attrs?.textAlign === "center" || wrapsAtMargin(paragraph)
                    ? { type: "hardBreak" }
                    : { type: "text", text: "\t", marks },
                );
              else if (
                (tag === "br" || tag === "cr") &&
                attr(part, "type") !== "page"
              )
                content.push({ type: "hardBreak" });
            }
          }
          if (content.some((item) => item.type === "pageField")) {
            node.attrs = {
              ...node.attrs,
              textAlign: "right",
              marginLeft: 0,
            };
            const first = content.find((item) => item.type === "text");
            if (first?.text) first.text = first.text.replace(/^\s+/, "");
          }
          node.content = content;
        }
      }
    } else node.content?.forEach(apply);
  };
  apply(document.content);

  const sourceProps = (paragraph: Element): Props => {
    const pPr = child(paragraph, "pPr");
    const style = resolveStyle(
      attr(child(pPr, "pStyle")) ?? defaultParagraphStyleId,
    );
    const run = {
      ...defaultRun,
      ...style.run,
      ...properties(child(pPr, "rPr")),
    };
    return {
      ...defaultParagraph,
      ...style.paragraph,
      ...properties(pPr),
      ...(typeof run.fontSize === "number" ? { fontSize: run.fontSize } : {}),
      preserveEmpty: true,
    };
  };
  const sourceGapNodes = (from: number, to: number): DocumentNode[] =>
    source
      .slice(from, to)
      .flatMap<DocumentNode>(({ paragraph, bodyParagraph, text }) => {
        if (
          !bodyParagraph ||
          normalized(text) ||
          consumedInlineRules.has(paragraph)
        )
          return [];
        const pPr = child(paragraph, "pPr");
        if (
          child(pPr, "sectPr") ||
          descendants(paragraph, "br").some((br) =>
            ["page", "column"].includes(attr(br, "type") ?? ""),
          )
        )
          return [];
        const props = sourceProps(paragraph);
        const lines = anchoredLines(paragraph);
        if (lines.length)
          return [
            {
              type: "lineGroup",
              attrs: {
                lines,
                labels: [],
                marginTop: Number(props.marginTop) || 0,
                marginBottom: Number(props.marginBottom) || 0,
                pageRelative: true,
                height: Math.max(
                  Number(props.fontSize) || 0,
                  ...lines.map((line) => line.top + line.thickness),
                ),
              },
            },
          ];
        return [{ type: "paragraph", attrs: props }];
      });
  if (document.content.content) {
    const output: DocumentNode[] = [];
    let previousSource = 0;
    const bounds = (node: DocumentNode): number[] => {
      const own = sourceIndices.get(node);
      return [
        ...(own === undefined ? [] : [own]),
        ...(node.content ?? []).flatMap(bounds),
      ];
    };
    for (const node of document.content.content) {
      const indices = bounds(node);
      const first = indices.length ? Math.min(...indices) : undefined;
      const last = indices.length ? Math.max(...indices) : undefined;
      if (first !== undefined && first >= previousSource)
        output.push(...sourceGapNodes(previousSource, first));
      output.push(node);
      if (last !== undefined)
        previousSource = Math.max(previousSource, last + 1);
    }
    output.push(...sourceGapNodes(previousSource, source.length));
    document.content.content = output;
  }
  if (numberingXml || sectionBreaks.length) {
    const flatten = (nodes: DocumentNode[]): DocumentNode[] =>
      nodes.flatMap((node) =>
        ["orderedList", "bulletList", "listItem"].includes(node.type)
          ? flatten(node.content ?? [])
          : [node],
      );
    const rebuild = (container: DocumentNode) => {
      if (
        !container.content ||
        !["doc", "tableCell", "tableHeader", "blockquote"].includes(
          container.type,
        )
      ) {
        container.content?.forEach(rebuild);
        return;
      }
      const output: DocumentNode[] = [];
      let active:
        { node: DocumentNode; info: ListInfo; count: number } | undefined;
      for (const node of flatten(container.content)) {
        if (breakBefore.has(node)) {
          output.push({ type: "pageBreak" });
          active = undefined;
        }
        const info = lists.get(node);
        if (
          info &&
          info.format !== "none" &&
          node.attrs?.textAlign === "center"
        ) {
          const marker =
            info.listStyleType === "dash"
              ? "- "
              : info.format !== "bullet"
                ? info.number + ". "
                : "";
          const text = plain(node).trim();
          if (marker && !text.startsWith(marker.trim()))
            node.content = [
              { type: "text", text: marker },
              ...(node.content ?? []),
            ];
          output.push(node);
          active = undefined;
          continue;
        }
        if (!info || info.format === "none") {
          // Remove Mammoth's synthetic, empty nesting wrappers.
          if (
            node.type !== "paragraph" ||
            plain(node).trim() ||
            node.attrs?.preserveEmpty
          )
            output.push(node);
          active = undefined;
          rebuild(node);
          continue;
        }
        const type = info.format === "bullet" ? "bulletList" : "orderedList";
        // Word's list indentation positions the marker and its text together.
        // The HTML list owns that offset; retaining paragraph style indents
        // inside each li applies the same offset a second time.
        node.attrs = { ...node.attrs, marginLeft: 0, textIndent: 0 };
        if (node.type === "heading") node.type = "paragraph";
        if (
          !active ||
          active.info.id !== info.id ||
          active.info.level !== info.level ||
          active.node.type !== type ||
          (type === "orderedList" &&
            info.number !== active.info.number + active.count)
        ) {
          const runStyle = node.content
            ?.find((child) => child.type === "text")
            ?.marks?.find((mark) => mark.type === "textStyle")?.attrs;
          const list: DocumentNode = {
            type,
            attrs: {
              ...(type === "orderedList" ? { start: info.number } : {}),
              color:
                info.color ??
                (type === "bulletList" ? runStyle?.color : undefined) ??
                "#000000",
              fontSize: info.fontSize ?? runStyle?.fontSize ?? 11,
              paddingLeft: info.paddingLeft ?? 20 + info.level * 12,
              ...(info.listStyleType
                ? { listStyleType: info.listStyleType }
                : {}),
            },
            content: [],
          };
          output.push(list);
          active = { node: list, info, count: 0 };
        }
        active.node.content!.push({
          type: "listItem",
          content: [node],
        });
        active.count++;
      }
      container.content = output;
    };
    rebuild(document.content);
  }
  if (document.content.content) {
    const boxes = Array.from(root.getElementsByTagName("wp:anchor")).flatMap(
      (anchor) => {
        const preset = Array.from(anchor.getElementsByTagName("a:prstGeom"))[0];
        const stroke = Array.from(anchor.getElementsByTagName("a:ln"))[0];
        const extent = child(anchor, "extent");
        const height = Number(extent?.getAttribute("cy")) / 12700;
        const width = Number(extent?.getAttribute("cx")) / 12700;
        const txbx = Array.from(
          anchor.getElementsByTagName("w:txbxContent"),
        )[0];
        if (
          preset?.getAttribute("prst") !== "rect" ||
          !stroke ||
          !txbx ||
          !(height >= 30 && width >= 200)
        )
          return [];
        const paragraphs = children(txbx, "p");
        if (paragraphs.length < 3) return [];
        const keys = paragraphs.map((paragraph) =>
          normalized(
            descendants(paragraph, "t")
              .map((text) => text.textContent ?? "")
              .join(""),
          ),
        );
        if (keys.some((key) => !key)) return [];
        const rows: DocumentNode[] = paragraphs.map((paragraph) => {
          const pPr = child(paragraph, "pPr");
          const style = resolveStyle(
            attr(child(pPr, "pStyle")) ?? defaultParagraphStyleId,
          );
          const paragraphMark = properties(child(pPr, "rPr"));
          // The paragraph mark's font is not the font of the words. Pages sets
          // Wingdings there for a checkbox while the sentence stays in the style.
          delete paragraphMark.fontFamily;
          const base = {
            ...defaultRun,
            ...style.run,
            ...paragraphMark,
          };
          const numId = attr(child(child(pPr, "numPr"), "numId"));
          const level = Number(attr(child(child(pPr, "numPr"), "ilvl"))) || 0;
          const numberingProps =
            numId && numId !== "0" ? levelDefinition(numId, level) : {};
          const segments: DocumentNode[][] = [[]];
          for (const run of descendants(paragraph, "r")) {
            const rPr = child(run, "rPr");
            const props = { ...base, ...properties(rPr) };
            const marks: NonNullable<DocumentNode["marks"]> = [];
            const visual = Object.fromEntries(
              Object.entries(props).filter(([key]) =>
                ["fontFamily", "fontSize", "color"].includes(key),
              ),
            );
            if (Object.keys(visual).length)
              marks.push({ type: "textStyle", attrs: visual });
            for (const key of ["bold", "italic", "underline", "strike"])
              if (props[key])
                marks.push(
                  key === "underline" && attr(child(rPr, "u")) === "double"
                    ? { type: key, attrs: { variant: "double" } }
                    : { type: key },
                );
            for (const part of Array.from(run.children)) {
              const tag = part.localName.split(":").at(-1);
              if (tag === "tab") {
                segments.push(
                  props.underline === true
                    ? [
                        {
                          type: "text",
                          text: "\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0",
                          marks: [
                            {
                              type: "textStyle",
                              attrs: {
                                ...visual,
                                blankUnderlineWidth: Math.max(
                                  20,
                                  Math.min(200, width / 4 - 24),
                                ),
                              },
                            },
                            ...marks.filter(
                              (mark) => mark.type !== "textStyle",
                            ),
                          ],
                        },
                      ]
                    : [],
                );
              } else if (tag === "t" && part.textContent)
                segments.at(-1)!.push({
                  type: "text",
                  text: part.textContent,
                  marks,
                });
            }
          }
          // Intermediate tab segments describe a supplementary blank after
          // the label; the last segment contains the amount and currency.
          const label =
            segments.length > 2 ? segments.slice(0, -2).flat() : segments[0];
          if (
            numberingProps.format === "bullet" &&
            numberingProps.marker === "-" &&
            !plain(label[0] ?? {})
              .trim()
              .startsWith("-")
          )
            label.unshift({ type: "text", text: "- " });
          const amount =
            segments.length > 2
              ? segments.slice(-2).flat()
              : segments.slice(1).flat();
          const paragraphNode = (
            content: DocumentNode[],
            align = "left",
          ): DocumentNode => ({
            type: "paragraph",
            attrs: { textAlign: align, marginTop: 0, marginBottom: 2 },
            content: content.length ? content : [{ type: "text", text: "" }],
          });
          const cell = (
            content: DocumentNode[],
            align = "left",
            colspan = 1,
          ): DocumentNode => ({
            type: "tableCell",
            attrs: {
              ...(colspan > 1 ? { colspan } : {}),
              colwidth:
                colspan > 1
                  ? null
                  : [
                      Math.round(
                        ((width * 96) / 72) * (align === "right" ? 0.25 : 0.75),
                      ),
                    ],
            },
            content: [paragraphNode(content, align)],
          });
          return {
            type: "tableRow",
            content: amount.length
              ? [cell(label), cell(amount, "right")]
              : [cell(label.length ? label : amount, "left", 2)],
          };
        });
        const left =
          Number(child(child(anchor, "positionH"), "posOffset")?.textContent) /
          12700;
        const indent = Math.max(0, Math.min(200, left - marginLeftPtEarly));
        return [
          {
            keys,
            node: {
              type: "table",
              attrs: {
                border: "box",
                boxWidth: Math.min(width, contentWidth - indent),
                ...(indent > 0
                  ? { marginLeft: indent, marginBottom: 6 }
                  : { marginBottom: 6 }),
              },
              content: rows,
            } satisfies DocumentNode,
          },
        ];
      },
    );
    const seen = new Set<string>();
    for (const box of boxes) {
      const signature = box.keys.join("|");
      if (seen.has(signature)) continue;
      seen.add(signature);
      const nodes = document.content.content;
      const norms = nodes.map((node) =>
        normalized(plain(node)).replace(/^-/, ""),
      );
      let start = -1;
      let end = -1;
      for (let index = 0; index < norms.length; index++) {
        let key = 0;
        let cursor = index;
        while (key < box.keys.length && cursor < norms.length) {
          if (!norms[cursor]) {
            cursor++;
            continue;
          }
          let combined = "";
          let consumed = 0;
          let matched = false;
          while (key + consumed < box.keys.length) {
            combined += box.keys[key + consumed];
            consumed++;
            if (combined === norms[cursor]) {
              key += consumed;
              cursor++;
              matched = true;
              break;
            }
            if (combined.length > norms[cursor].length) break;
          }
          if (!matched) break;
        }
        if (key === box.keys.length) {
          start = index;
          end = cursor;
          break;
        }
      }
      if (start >= 0) {
        nodes.splice(start, end - start, box.node);
        continue;
      }
      const combined = box.keys.join("");
      const at = norms.findIndex(
        (value) =>
          value === combined ||
          (value.includes(box.keys[0]) &&
            value.includes(box.keys[box.keys.length - 1]) &&
            value.length <= combined.length + 40),
      );
      if (at >= 0) nodes.splice(at, 1, box.node);
    }
  }
  // A cached Word boundary can sit between runs in a paragraph. Preserve the
  // text and its marks on both sides instead of moving the whole paragraph.
  const restoreInlineBreaks = (container: DocumentNode) => {
    if (!container.content) return;
    container.content = container.content.flatMap((node) => {
      const offsets = inlineRenderedBreaks.get(node);
      if (
        node.type !== "paragraph" ||
        !offsets?.length ||
        !node.content ||
        container.type !== "doc"
      ) {
        restoreInlineBreaks(node);
        return [node];
      }
      const chunks: DocumentNode[][] = [[]];
      let position = 0;
      let next = 0;
      for (const item of node.content) {
        if (item.type !== "text") {
          chunks.at(-1)!.push(item);
          continue;
        }
        let remaining = item.text ?? "";
        while (
          next < offsets.length &&
          offsets[next] <= position + remaining.length
        ) {
          const count = offsets[next] - position;
          if (count > 0)
            chunks.at(-1)!.push({ ...item, text: remaining.slice(0, count) });
          remaining = remaining.slice(count);
          position += count;
          next++;
          chunks.push([]);
        }
        if (remaining) chunks.at(-1)!.push({ ...item, text: remaining });
        position += remaining.length;
      }
      return chunks.flatMap((content, index) => [
        ...(index ? [{ type: "pageBreak" } as DocumentNode] : []),
        {
          ...node,
          attrs: {
            ...node.attrs,
            ...(index ? { marginTop: 0, textIndent: 0 } : {}),
          },
          content,
        },
      ]);
    });
  };
  restoreInlineBreaks(document.content);
  const section = descendants(root, "sectPr").at(-1);
  const dimensions = child(section, "pgSz"),
    margins = child(section, "pgMar");
  for (const [sourceKey, target] of [
    ["w", "width"],
    ["h", "height"],
  ] as const) {
    const mm = (Number(attr(dimensions, sourceKey)) * 25.4) / 1440;
    if (mm >= 50 && mm <= (target === "width" ? 500 : 700))
      document.page[target] = mm;
  }
  for (const [sourceKey, target] of [
    ["top", "marginTop"],
    ["bottom", "marginBottom"],
    ["left", "marginLeft"],
    ["right", "marginRight"],
  ] as const) {
    const raw = attr(margins, sourceKey),
      mm = (Number(raw) * 25.4) / 1440;
    if (raw !== undefined && mm >= 0 && mm <= 100) document.page[target] = mm;
  }
  const marginLeftPt = (document.page.marginLeft * 72) / 25.4;
  const adjustLines = (node: DocumentNode) => {
    if (
      node.type === "lineGroup" &&
      node.attrs?.pageRelative === true &&
      Array.isArray(node.attrs?.lines)
    )
      node.attrs.lines = (node.attrs.lines as ImportedLine[]).map((line) => ({
        ...line,
        left: line.left - marginLeftPt,
      }));
    node.content?.forEach(adjustLines);
  };
  adjustLines(document.content);
}
