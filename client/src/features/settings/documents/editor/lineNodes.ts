import { Node } from '@tiptap/core';
import { DEFAULT_FONT_PT, LAYOUT_MAX_PT } from '../consts/editor.consts';
import { finiteLayout, labelStyle, paintRules } from '../util/lineLayout.util';

export const LineLabel = Node.create({
  name: 'lineLabel',
  group: 'block',
  content: 'inline*',
  selectable: false,
  addAttributes() {
    return {
      left: { default: 0 },
      top: { default: 0 },
      fontSize: { default: DEFAULT_FONT_PT },
      fontFamily: { default: null },
      color: { default: '#000000' },
      centered: { default: false },
      bold: { default: false },
      italic: { default: false },
      underline: { default: false },
    };
  },
  parseHTML: () => [{ tag: 'span[data-line-label]' }],
  renderHTML({ node }) {
    return [
      'span',
      { 'data-line-label': '', style: labelStyle(node.attrs) },
      0,
    ];
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span');
      dom.dataset.lineLabel = '';
      let lastStyle = '';
      const paint = (attrs: Record<string, unknown>) => {
        const style = labelStyle(attrs);
        if (style !== lastStyle) {
          dom.style.cssText = style;
          lastStyle = style;
        }
      };
      paint(node.attrs);
      return {
        dom,
        contentDOM: dom,
        ignoreMutation(mutation) {
          return mutation.type === 'attributes' && mutation.target === dom;
        },
        update(next) {
          if (next.type.name !== 'lineLabel') return false;
          paint(next.attrs);
          return true;
        },
      };
    };
  },
});

export const LineGroup = Node.create({
  name: 'lineGroup',
  group: 'block',
  content: 'lineLabel*',
  selectable: false,
  addAttributes() {
    return {
      lines: { default: [] },
      height: { default: 0 },
      marginTop: { default: 0 },
      marginBottom: { default: 0 },
      labels: { default: [] },
      pageRelative: { default: false, rendered: false },
    };
  },
  parseHTML: () => [{ tag: 'div[data-line-group]' }],
  renderHTML({ node }) {
    const height = finiteLayout(node.attrs.height, 0, LAYOUT_MAX_PT);
    const marginTop = finiteLayout(node.attrs.marginTop, 0, LAYOUT_MAX_PT);
    const marginBottom = finiteLayout(
      node.attrs.marginBottom,
      0,
      LAYOUT_MAX_PT
    );
    return [
      'div',
      {
        'data-line-group': '',
        style: `position:relative;height:${height}pt;margin-top:${marginTop}pt;margin-bottom:${marginBottom}pt`,
      },
      0,
    ];
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.dataset.lineGroup = '';
      const rules = document.createElement('div');
      const content = document.createElement('div');
      // Give positioned text a real editable hit area without moving its labels.
      content.style.cssText = 'position:relative;height:100%';
      rules.contentEditable = 'false';
      rules.setAttribute('aria-hidden', 'true');
      rules.style.pointerEvents = 'none';
      dom.append(rules, content);
      let lastStyle = '';
      let lastRules = '';
      const paint = (current: { attrs: Record<string, unknown> }) => {
        const height = finiteLayout(current.attrs.height, 0, LAYOUT_MAX_PT);
        const marginTop = finiteLayout(
          current.attrs.marginTop,
          0,
          LAYOUT_MAX_PT
        );
        const marginBottom = finiteLayout(
          current.attrs.marginBottom,
          0,
          LAYOUT_MAX_PT
        );
        const style = `position:relative;height:${height}pt;margin-top:${marginTop}pt;margin-bottom:${marginBottom}pt`;
        if (style !== lastStyle) {
          dom.style.cssText = style;
          lastStyle = style;
        }
        const lines = JSON.stringify(current.attrs.lines);
        if (lines !== lastRules) {
          paintRules(rules, current.attrs.lines);
          lastRules = lines;
        }
      };
      paint(node);
      return {
        dom,
        contentDOM: content,
        ignoreMutation(mutation) {
          // Decorations are repainted by this node view, never edited text.
          return (
            (mutation.type === 'attributes' && mutation.target === dom) ||
            (mutation.type !== 'selection' && rules.contains(mutation.target))
          );
        },
        update(next) {
          if (next.type.name !== 'lineGroup') return false;
          paint(next);
          return true;
        },
      };
    };
  },
});
