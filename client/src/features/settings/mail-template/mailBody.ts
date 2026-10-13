import { mailPillClassName } from './mailPlaceholders';

export function splitMailBody(body: string, tokens: readonly string[]) {
  if (tokens.length === 0) return [{ type: 'text' as const, value: body }];
  const pattern = new RegExp(
    `\\{\\{(${tokens.map(escapeRegExp).join('|')})\\}\\}`,
    'g'
  );
  const parts: Array<
    { type: 'text'; value: string } | { type: 'pill'; token: string }
  > = [];
  let last = 0;
  for (const match of body.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) {
      parts.push({ type: 'text', value: body.slice(last, index) });
    }
    parts.push({ type: 'pill', token: match[1] });
    last = index + match[0].length;
  }
  if (last < body.length) {
    parts.push({ type: 'text', value: body.slice(last) });
  }
  return parts;
}

export function createMailPill(token: string) {
  const pill = document.createElement('span');
  pill.dataset.mailPlaceholder = token;
  pill.contentEditable = 'false';
  pill.className = mailPillClassName;
  pill.textContent = token;
  return pill;
}

export function paintMailBody(
  root: HTMLElement,
  body: string,
  tokens: readonly string[]
) {
  root.replaceChildren();
  for (const part of splitMailBody(body, tokens)) {
    if (part.type === 'pill') {
      root.append(createMailPill(part.token));
      continue;
    }
    appendText(root, part.value);
  }
}

export function readMailBody(root: HTMLElement) {
  const chunks: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      chunks.push((node.textContent ?? '').replace(/\u00a0/g, ' '));
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    const token = node.dataset.mailPlaceholder;
    if (token) {
      chunks.push(`{{${token}}}`);
      return;
    }
    if (node.tagName === 'BR') {
      chunks.push('\n');
      return;
    }
    const block = node.tagName === 'DIV' || node.tagName === 'P';
    if (block && chunks.length > 0 && chunks.at(-1) !== '\n') {
      chunks.push('\n');
    }
    node.childNodes.forEach(walk);
  };
  root.childNodes.forEach(walk);
  return chunks.join('').replace(/\n+$/, '');
}

export function containsLiteralPlaceholder(
  root: HTMLElement,
  tokens: readonly string[]
) {
  if (tokens.length === 0) return false;
  const pattern = new RegExp(
    `\\{\\{(${tokens.map(escapeRegExp).join('|')})\\}\\}`
  );
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (pattern.test(node.textContent ?? '')) return true;
    node = walker.nextNode();
  }
  return false;
}

export function insertMailPlaceholder(
  root: HTMLElement,
  token: string,
  range: Range | null
) {
  const pill = createMailPill(token);
  const target = editableRange(root, range);
  target.collapse(true);
  const before = adjacentChar(target, 'before');
  const after = adjacentChar(target, 'after');
  const fragment = document.createDocumentFragment();
  if (needsSpace(before)) fragment.append(document.createTextNode(' '));
  fragment.append(pill);
  if (needsSpace(after)) fragment.append(document.createTextNode(' '));
  target.insertNode(fragment);
  placeCaretAfter(pill);
}

export function rangeFromPoint(x: number, y: number) {
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (
      x: number,
      y: number
    ) => { offsetNode: Node; offset: number } | null;
  };
  const range = doc.caretRangeFromPoint?.(x, y);
  if (range) return range;
  const position = doc.caretPositionFromPoint?.(x, y);
  if (!position) return null;
  const next = document.createRange();
  next.setStart(position.offsetNode, position.offset);
  next.collapse(true);
  return next;
}

function appendText(root: HTMLElement, value: string) {
  const lines = value.split('\n');
  lines.forEach((line, index) => {
    if (index > 0) root.append(document.createElement('br'));
    if (line) root.append(document.createTextNode(line));
  });
}

function editableRange(root: HTMLElement, range: Range | null) {
  const inside = range && nodeInside(root, range.startContainer) ? range : null;
  if (!inside) {
    const end = document.createRange();
    end.selectNodeContents(root);
    end.collapse(false);
    return end;
  }
  const container = inside.startContainer;
  const pill =
    container instanceof HTMLElement && container.dataset.mailPlaceholder
      ? container
      : container.parentElement?.dataset.mailPlaceholder
        ? container.parentElement
        : null;
  if (!pill) return inside;
  const after = document.createRange();
  after.setStartAfter(pill);
  after.collapse(true);
  return after;
}

function placeCaretAfter(node: Node) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.setStartAfter(node);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function nodeInside(root: HTMLElement, node: Node) {
  return node === root || root.contains(node);
}

function adjacentChar(range: Range, direction: 'before' | 'after') {
  const container = range.startContainer;
  const offset = range.startOffset;
  if (container.nodeType === Node.TEXT_NODE) {
    const text = container.textContent ?? '';
    return direction === 'before'
      ? text.slice(0, offset).slice(-1)
      : text.slice(offset, offset + 1);
  }
  const child =
    container.childNodes[direction === 'before' ? offset - 1 : offset];
  if (!child) return '';
  if (child instanceof HTMLElement && child.dataset.mailPlaceholder) {
    return '•';
  }
  if (child.nodeType !== Node.TEXT_NODE) return '';
  const text = child.textContent ?? '';
  return direction === 'before' ? text.slice(-1) : text.slice(0, 1);
}

function needsSpace(char: string) {
  return char === '•' || /[A-Za-z0-9ÄÖÜäöüß]/.test(char);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
