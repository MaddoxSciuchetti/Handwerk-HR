import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { render, screen, waitFor } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import {
  editorPagination,
  paginateBlocks,
} from '@/features/settings/documents/editorPagination';
import { StyledDocumentEditor } from '@/features/settings/documents/StyledDocumentEditor';
import { fromSegments } from '@/features/settings/documents/styledDocument';

it('keeps content within paper margins and handles explicit page breaks', () => {
  const result = paginateBlocks(
    [
      { pos: 0, top: 0, height: 70 },
      { pos: 20, top: 70, height: 40 },
      { pos: 40, top: 110, height: 0, break: true },
      { pos: 41, top: 110, height: 20 },
    ],
    100,
    140
  );
  expect(result).toEqual({
    gaps: [
      { pos: 20, height: 70 },
      { pos: 40, height: 100 },
    ],
    pages: 3,
  });
});
it('renders separate editable sheets without publishing pagination into the document', async () => {
  const document = fromSegments([{ type: 'text', text: 'First page' }]);
  document.content.content!.push(
    { type: 'pageBreak' },
    { type: 'paragraph', content: [{ type: 'text', text: 'Second page' }] }
  );
  const onChange = vi.fn();
  const { container } = render(
    <StyledDocumentEditor
      document={document}
      master
      pageView
      onChange={onChange}
    />
  );
  await screen.findByLabelText('Editorseite 2');
  await waitFor(() =>
    expect(
      container.querySelector('[data-editor-page-gap]')
    ).toBeInTheDocument()
  );
  expect(container.querySelector('.tiptap')).toHaveAttribute(
    'contenteditable',
    'true'
  );
  expect(onChange).not.toHaveBeenCalled();
  expect(document.content.content).toHaveLength(3);
});

it.each([1, 0.75, 1.25])(
  'keeps table page gaps stable across resize measurements at zoom %s',
  (zoom) => {
    let nextFrame: FrameRequestCallback | undefined;
    let resize = () => {};
    let noise = 0;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      nextFrame = callback;
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {
      nextFrame = undefined;
    });
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resize = callback;
        }
        observe() {}
        disconnect() {}
      }
    );
    const rects = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        let top = 0;
        let height = 0;
        const table =
          this.tagName === 'TABLE' || this.classList.contains('tableWrapper');
        if (this.tagName === 'P' && this.textContent?.includes('First'))
          height = 70;
        else if (
          table ||
          (this.tagName === 'P' && this.textContent === 'After')
        ) {
          const gaps = Array.from(
            this.closest('.tiptap')!.querySelectorAll<HTMLElement>(
              '[data-editor-page-gap]'
            )
          ).filter((gap) => gap.style.display !== 'none');
          const shift = gaps.reduce(
            (sum, gap) => sum + Number(gap.dataset.height),
            0
          );
          // Visible widgets can change collapsed margins as well as add height.
          const reflow = gaps.length ? (shift > 59 ? 6 : 0) : 0;
          top = (table ? 70 : 110) + shift + reflow;
          height = table ? 40 : 10;
        }
        return {
          x: 0,
          y: top * zoom,
          top: top * zoom + noise,
          bottom: (top + height) * zoom + noise,
          left: 0,
          right: 100,
          width: 100,
          height: height * zoom,
          toJSON: () => ({}),
        };
      });
    let editor: Editor | undefined;
    try {
      const onPages = vi.fn();
      editor = new Editor({
        extensions: [
          StarterKit,
          TableKit,
          editorPagination(
            () => ({
              enabled: true,
              height: (100 * 25.4) / 96,
              top: 0,
              bottom: 0,
              zoom,
            }),
            onPages
          ),
        ],
        content:
          '<p>First</p><table><tbody><tr><td><p>Brutto-Arbeitsentgelt insgesamt</p></td></tr></tbody></table><p>After</p>',
      });
      const flush = () => {
        const callback = nextFrame;
        nextFrame = undefined;
        callback?.(0);
      };
      flush();
      const original = editor.getJSON();
      const spacer = editor.view.dom.querySelector<HTMLElement>(
        '[data-editor-page-gap]'
      )!;
      expect(Number(spacer.dataset.height)).toBeCloseTo(62);
      const transactions = vi.fn();
      editor.on('transaction', transactions);
      for (let index = 0; index < 8; index += 1) {
        noise = index % 2 ? 0.0001 : 0;
        resize();
        flush();
        expect(editor.view.dom.querySelector('[data-editor-page-gap]')).toBe(
          spacer
        );
        expect(spacer.style.display).toBe('block');
      }
      expect(transactions).not.toHaveBeenCalled();
      expect(editor.getJSON()).toEqual(original);
      expect(onPages.mock.calls.every(([pages]) => pages === 2)).toBe(true);
      // Position metadata on existing widgets must not affect remeasurement
      // after editing text before a page boundary.
      editor.commands.deleteRange({ from: 1, to: 2 });
      flush();
      const moved = editor.view.dom.querySelector('[data-editor-page-gap]');
      transactions.mockClear();
      resize();
      flush();
      expect(editor.view.dom.querySelector('[data-editor-page-gap]')).toBe(
        moved
      );
      expect(transactions).not.toHaveBeenCalled();
    } finally {
      editor?.destroy();
      rects.mockRestore();
      vi.unstubAllGlobals();
    }
  }
);
