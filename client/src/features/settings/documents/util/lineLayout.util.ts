import {
  DEFAULT_FONT_PT,
  LAYOUT_MAX_PT,
  LAYOUT_MIN_PT,
  LINE_LABEL_FONT_FAMILIES,
  MAX_FONT_PT,
  MAX_LINE_RULES,
  MIN_FONT_PT,
} from '../consts/editor.consts';

export type EditorNode = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: EditorNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

export function finiteLayout(value: unknown, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : 0;
}

function hexColor(value: unknown) {
  return /^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : '#000000';
}

function labelFontFamily(value: unknown) {
  const family = String(value);
  return LINE_LABEL_FONT_FAMILIES.includes(
    family as (typeof LINE_LABEL_FONT_FAMILIES)[number]
  )
    ? family
    : 'inherit';
}

export function labelContent(label: Record<string, unknown>): EditorNode[] {
  if (!Array.isArray(label.runs)) {
    const text = String(label.text ?? '');
    return text ? [{ type: 'text', text }] : [];
  }
  return label.runs.flatMap((raw) => {
    const run = raw as { text?: unknown; props?: Record<string, unknown> };
    const text = String(run.text ?? '');
    if (!text) return [];
    const props = run.props ?? {};
    const marks: NonNullable<EditorNode['marks']> = [];
    if (props.bold === true) marks.push({ type: 'bold' });
    if (props.italic === true) marks.push({ type: 'italic' });
    if (props.underline === true) marks.push({ type: 'underline' });
    const style: Record<string, unknown> = {};
    const size = Number(props.fontSize);
    // Font sizes are numeric points throughout the document model.
    if (size > 0) style.fontSize = size;
    if (typeof props.fontFamily === 'string')
      style.fontFamily = props.fontFamily;
    if (typeof props.color === 'string') style.color = props.color;
    if (Object.keys(style).length)
      marks.push({ type: 'textStyle', attrs: style });
    return [{ type: 'text', text, ...(marks.length ? { marks } : {}) }];
  });
}

export function labelStyle(attrs: Record<string, unknown>) {
  const left = finiteLayout(attrs.left, LAYOUT_MIN_PT, LAYOUT_MAX_PT);
  const top = finiteLayout(attrs.top, LAYOUT_MIN_PT, LAYOUT_MAX_PT);
  const fontSize =
    finiteLayout(attrs.fontSize, MIN_FONT_PT, MAX_FONT_PT) || DEFAULT_FONT_PT;
  const centered = attrs.centered === true ? 'transform:translateX(-50%);' : '';
  const bold = attrs.bold === true ? 'font-weight:700;' : '';
  const italic = attrs.italic === true ? 'font-style:italic;' : '';
  const underline =
    attrs.underline === true
      ? 'text-decoration:underline;text-underline-offset:0.12em;'
      : '';
  return (
    'position:absolute;white-space:pre;outline:none;caret-color:currentColor;' +
    `cursor:text;left:${left}pt;top:${top}pt;font-family:${labelFontFamily(attrs.fontFamily)};` +
    `font-size:${fontSize}pt;color:${hexColor(attrs.color)};` +
    centered +
    bold +
    italic +
    underline
  );
}

export function paintRules(target: HTMLElement, lines: unknown) {
  const list = Array.isArray(lines) ? lines.slice(0, MAX_LINE_RULES) : [];
  target.replaceChildren(
    ...list.map((raw) => {
      const line = raw as Record<string, unknown>;
      const rule = document.createElement('span');
      const left = finiteLayout(line.left, LAYOUT_MIN_PT, LAYOUT_MAX_PT);
      const top = finiteLayout(line.top, LAYOUT_MIN_PT, LAYOUT_MAX_PT);
      const width = finiteLayout(line.width, 0, LAYOUT_MAX_PT);
      const thickness = finiteLayout(line.thickness, 0.25, 10) || 0.5;
      rule.style.cssText =
        `position:absolute;pointer-events:none;left:${left}pt;top:${top}pt;` +
        `width:${width}pt;border-top:${thickness}pt solid ${hexColor(line.color)}`;
      return rule;
    })
  );
}

export function normalizeLineLabels<T>(node: T): T {
  if (!node || typeof node !== 'object') return node;
  const current = node as EditorNode;
  const content = current.content?.map((child) => normalizeLineLabels(child));
  if (current.type !== 'lineGroup') return { ...current, content } as T;
  const labels = Array.isArray(current.attrs?.labels)
    ? (current.attrs.labels as Record<string, unknown>[])
    : [];
  if (content?.some((child) => child.type === 'lineLabel'))
    return { ...current, content } as T;
  return {
    ...current,
    content: labels.map((label) => ({
      type: 'lineLabel',
      attrs: {
        left: Number(label.left) || 0,
        top: Number(label.top) || 0,
        fontSize: Number(label.fontSize) || DEFAULT_FONT_PT,
        fontFamily: label.fontFamily ?? null,
        color: label.color ?? '#000000',
        centered: label.centered === true,
        bold: label.bold === true,
        italic: label.italic === true,
        underline: label.underline === true,
      },
      content: labelContent(label),
    })),
  } as T;
}
