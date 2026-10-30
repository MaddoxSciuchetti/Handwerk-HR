import { Extension } from '@tiptap/core';
import { keymap } from '@tiptap/pm/keymap';
import { Plugin } from '@tiptap/pm/state';
import {
  BLANK_UNDERLINE_BORDER_PT,
  LAYOUT_MAX_PT,
  MAX_BLANK_UNDERLINE_PT,
  MAX_TABLE_MARGIN_PT,
} from '../consts/editor.consts';
import {
  cellDepthAt,
  insertStyledSalaryRowAfter,
} from '../util/salaryTableEnter.util';

const LIST_STYLE_TYPES: Record<string, string> = {
  disc: 'disc',
  circle: 'circle',
  square: 'square',
  dash: '"- "',
};

const SPACED_BLOCK_ATTRS = [
  'fontSize',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'textIndent',
  'lineHeight',
  'paddingLeft',
] as const;

export const Layout = Extension.create({
  name: 'documentLayout',
  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      // Salary amount cells are the right column of a 2-col table. Enter must
      // open a new row on the left, not another right-aligned paragraph.
      keymap({
        Enter: () => insertStyledSalaryRowAfter(editor),
      }),
      new Plugin({
        // TipTap copies textAlign onto the block created by Enter. An empty
        // right/center line then parks the caret on the right edge.
        appendTransaction(transactions, _oldState, newState) {
          if (!transactions.some((transaction) => transaction.docChanged))
            return null;
          const { $from } = newState.selection;
          if ($from.parentOffset !== 0) return null;
          const parent = $from.parent;
          if (
            (parent.type.name !== 'paragraph' &&
              parent.type.name !== 'heading') ||
            parent.content.size > 0
          )
            return null;
          const align = parent.attrs.textAlign;
          if (align !== 'right' && align !== 'center') return null;
          // Inside a salary amount cell, Enter already inserts a new row.
          if (cellDepthAt($from) >= 0) return null;
          const index = $from.index($from.depth - 1);
          if (index === 0) return null;
          const previous = $from.node($from.depth - 1).child(index - 1);
          if (
            previous.type !== parent.type ||
            previous.content.size === 0 ||
            previous.attrs.textAlign !== align
          )
            return null;
          return newState.tr.setNodeMarkup($from.before(), undefined, {
            ...parent.attrs,
            textAlign: 'left',
          });
        },
      }),
    ];
  },
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          blankUnderlineWidth: {
            default: null,
            parseHTML: (element) =>
              Number(element.getAttribute('data-blank-underline-width')) ||
              null,
            renderHTML: (attrs) =>
              Number(attrs.blankUnderlineWidth) > 0 &&
              Number(attrs.blankUnderlineWidth) <= MAX_BLANK_UNDERLINE_PT
                ? {
                    'data-blank-underline-width': String(
                      attrs.blankUnderlineWidth
                    ),
                    style: `display:inline-block;width:${Number(attrs.blankUnderlineWidth)}pt;border-bottom:${BLANK_UNDERLINE_BORDER_PT}pt solid currentColor;line-height:1;text-decoration:none`,
                  }
                : {},
          },
          fontSize: {
            default: null,
            parseHTML: (el) => parseFloat(el.style.fontSize) || null,
            renderHTML: (attrs) =>
              attrs.fontSize
                ? { style: 'font-size:' + attrs.fontSize + 'pt' }
                : {},
          },
        },
      },
      {
        types: ['table'],
        attributes: {
          boxWidth: {
            default: null,
            parseHTML: (element) =>
              Number(element.getAttribute('data-box-width')) || null,
            renderHTML: (attrs) =>
              Number(attrs.boxWidth) > 0 &&
              Number(attrs.boxWidth) <= LAYOUT_MAX_PT
                ? {
                    'data-box-width': String(attrs.boxWidth),
                    style: `width:${Number(attrs.boxWidth)}pt;max-width:calc(100% - ${Math.max(0, Math.min(MAX_TABLE_MARGIN_PT, Number(attrs.marginLeft) || 0))}pt)`,
                  }
                : {},
          },
          border: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-border'),
            renderHTML: (attrs) =>
              attrs.border === 'box' || attrs.border === 'none'
                ? { 'data-border': String(attrs.border) }
                : {},
          },
        },
      },
      {
        types: ['paragraph', 'heading', 'bulletList', 'orderedList', 'table'],
        attributes: {
          // Retain import coordinates as metadata, not browser positioning.
          x: { default: null, rendered: false },
          preserveEmpty: { default: null, rendered: false },
          color: {
            default: null,
            renderHTML: (attrs) =>
              /^#[0-9a-f]{6}$/i.test(String(attrs.color))
                ? { style: 'color:' + attrs.color }
                : {},
          },
          listStyleType: {
            default: null,
            renderHTML: (attrs) =>
              typeof attrs.listStyleType === 'string' &&
              Object.hasOwn(LIST_STYLE_TYPES, attrs.listStyleType)
                ? {
                    style:
                      'list-style-type:' +
                      LIST_STYLE_TYPES[attrs.listStyleType],
                  }
                : {},
          },
          ...Object.fromEntries(
            SPACED_BLOCK_ATTRS.map((key) => [
              key,
              {
                default: null,
                renderHTML: (attrs: Record<string, unknown>) =>
                  attrs[key] == null
                    ? {}
                    : {
                        style:
                          key.replace(
                            /[A-Z]/g,
                            (letter) => '-' + letter.toLowerCase()
                          ) +
                          ':' +
                          attrs[key] +
                          (key === 'lineHeight' ? '' : 'pt'),
                      },
              },
            ])
          ),
        },
      },
    ];
  },
});
