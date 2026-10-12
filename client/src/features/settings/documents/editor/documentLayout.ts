import { Extension } from '@tiptap/core';

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
              Number(attrs.blankUnderlineWidth) <= 200
                ? {
                    'data-blank-underline-width': String(
                      attrs.blankUnderlineWidth
                    ),
                    style: `display:inline-block;width:${Number(attrs.blankUnderlineWidth)}pt;border-bottom:0.5pt solid currentColor;line-height:1;text-decoration:none`,
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
              Number(attrs.boxWidth) > 0 && Number(attrs.boxWidth) <= 2000
                ? {
                    'data-box-width': String(attrs.boxWidth),
                    style: `width:${Number(attrs.boxWidth)}pt;max-width:calc(100% - ${Math.max(0, Math.min(200, Number(attrs.marginLeft) || 0))}pt)`,
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
