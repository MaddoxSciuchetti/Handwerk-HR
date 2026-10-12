import { Node } from '@tiptap/core';

export const PageField = Node.create({
  name: 'pageField',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes() {
    return {
      kind: {
        default: 'page',
        parseHTML: (element) =>
          element.getAttribute('data-page-field') === 'pages'
            ? 'pages'
            : 'page',
      },
    };
  },
  parseHTML: () => [{ tag: 'span[data-page-field]' }],
  renderHTML({ node }) {
    const pages = node.attrs.kind === 'pages';
    return [
      'span',
      {
        'data-page-field': pages ? 'pages' : 'page',
        class: pages ? 'totalPages' : 'pageNumber',
      },
      pages ? '‹Seiten›' : '‹Seite›',
    ];
  },
});

export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  parseHTML: () => [{ tag: 'div[data-page-break]' }],
  renderHTML: () => ['div', { 'data-page-break': '' }],
});
