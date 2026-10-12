import { Node } from '@tiptap/core';
import { LAYOUT_MAX_PT } from '../consts/editor.consts';
import { finiteLayout, labelStyle, paintRules } from '../util/lineLayout.util';

export const LineLabel = Node.create({
  name: 'lineLabel',
  group: 'block',
  content: 'text*',
  addAttributes() {
    return {
      left: { default: 0 },
      top: { default: 0 },
      fontSize: { default: 11 },
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
      const paint = (attrs: Record<string, unknown>) => {
        dom.style.cssText = labelStyle(attrs);
      };
      paint(node.attrs);
      return {
        dom,
        contentDOM: dom,
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
      dom.append(rules, content);
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
        dom.style.cssText = `position:relative;height:${height}pt;margin-top:${marginTop}pt;margin-bottom:${marginBottom}pt`;
        paintRules(rules, current.attrs.lines);
      };
      paint(node);
      return {
        dom,
        contentDOM: content,
        update(next) {
          if (next.type.name !== 'lineGroup') return false;
          paint(next);
          return true;
        },
      };
    };
  },
});
