import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import {
  CSS_PX_PER_INCH,
  MM_PER_INCH,
  PAGE_BREAK_SLOP_PX,
  PAGE_SHEET_GAP_PX,
} from './consts/editor.consts';

export type PageBlock = {
  pos: number;
  top: number;
  height: number;
  break?: boolean;
};
export function paginateBlocks(
  blocks: PageBlock[],
  body: number,
  pitch: number
) {
  let shift = 0;
  let page = 0;
  const gaps: { pos: number; height: number }[] = [];
  for (const block of blocks) {
    const top = block.top + shift;
    const bottom = page * pitch + body;
    if (
      block.break ||
      (top + block.height > bottom + PAGE_BREAK_SLOP_PX &&
        top > page * pitch + PAGE_BREAK_SLOP_PX)
    ) {
      const height = (page + 1) * pitch - top;
      if (height > 0) {
        gaps.push({ pos: block.pos, height });
        shift += height;
      }
      page++;
    }
    // A block taller than a page cannot be kept together.
    page = Math.max(
      page,
      Math.floor((block.top + shift + Math.max(0, block.height - 1)) / pitch)
    );
  }
  return { gaps, pages: page + 1 };
}

export function editorPagination(
  getLayout: () => {
    enabled: boolean;
    height: number;
    top: number;
    bottom: number;
    zoom: number;
  },
  onPages: (count: number) => void
) {
  const key = new PluginKey<DecorationSet>('editor-paper-pagination');
  return Extension.create({
    name: 'editorPaperPagination',
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key,
          state: {
            init: () => DecorationSet.empty,
            apply: (tr, previous) =>
              tr.getMeta(key) ?? previous.map(tr.mapping, tr.doc),
          },
          props: { decorations: (state) => key.getState(state) },
          view(view) {
            let frame = 0;
            let signature = '';
            let lastLayout = JSON.stringify(getLayout());
            let alive = true;
            const measure = () => {
              frame = 0;
              const layout = getLayout();
              lastLayout = JSON.stringify(layout);
              if (!layout.enabled || !alive) return;
              const px = CSS_PX_PER_INCH / MM_PER_INCH;
              const body = (layout.height - layout.top - layout.bottom) * px;
              const pitch = layout.height * px + PAGE_SHEET_GAP_PX;
              const spacers = Array.from(
                view.dom.querySelectorAll<HTMLElement>('[data-editor-page-gap]')
              );
              const blocks: PageBlock[] = [];
              // Measure natural flow, not the previous pagination result. Gap
              // widgets affect margin collapse and table/list geometry, so
              // subtracting their heights can feed those changes back forever.
              const displays = spacers.map((spacer) => spacer.style.display);
              spacers.forEach((spacer) => {
                spacer.style.display = 'none';
              });
              try {
                const origin = view.dom.getBoundingClientRect().top;
                // Subpixel noise at different zoom/scroll positions must not
                // replace otherwise identical decorations on every resize.
                const pixels = (value: number) =>
                  Math.round((value / layout.zoom) * 64) / 64;
                view.state.doc.forEach((node, offset) => {
                  const add = (pos: number, isBreak = false) => {
                    const element = view.nodeDOM(pos);
                    if (!(element instanceof HTMLElement)) return;
                    const rect = element.getBoundingClientRect();
                    blocks.push({
                      pos,
                      top: pixels(rect.top - origin),
                      height: isBreak ? 0 : pixels(rect.height),
                      break: isBreak,
                    });
                  };
                  if (
                    node.type.name === 'orderedList' ||
                    node.type.name === 'bulletList'
                  )
                    node.forEach((_item, index) => add(offset + 1 + index));
                  else add(offset, node.type.name === 'pageBreak');
                });
              } finally {
                spacers.forEach((spacer, index) => {
                  spacer.style.display = displays[index];
                });
              }
              const result = paginateBlocks(blocks, body, pitch);
              onPages(result.pages);
              const next = JSON.stringify(result.gaps);
              if (next === signature) return;
              signature = next;
              const decorations = result.gaps.map((gap) =>
                Decoration.widget(
                  gap.pos,
                  () => {
                    const spacer = window.document.createElement('div');
                    spacer.dataset.editorPageGap = '';
                    spacer.dataset.position = String(gap.pos);
                    spacer.dataset.height = String(gap.height);
                    spacer.setAttribute('aria-hidden', 'true');
                    spacer.style.cssText = `height:${gap.height}px;display:block;pointer-events:none;margin:0;padding:0;border:0;`;
                    return spacer;
                  },
                  { side: -1, key: `${gap.pos}:${gap.height}` }
                )
              );
              view.dispatch(
                view.state.tr
                  .setMeta(
                    key,
                    DecorationSet.create(view.state.doc, decorations)
                  )
                  .setMeta('addToHistory', false)
              );
            };
            const schedule = () => {
              if (!frame && alive) frame = requestAnimationFrame(measure);
            };
            const observer =
              typeof ResizeObserver === 'undefined'
                ? undefined
                : new ResizeObserver(schedule);
            observer?.observe(view.dom);
            void window.document.fonts?.ready.then(schedule);
            schedule();
            return {
              update(current, previous) {
                // Selecting text does not change page geometry. Avoid layout
                // work and decoration updates during mouse selection.
                if (
                  !current.state.doc.eq(previous.doc) ||
                  JSON.stringify(getLayout()) !== lastLayout
                )
                  schedule();
              },
              destroy: () => {
                alive = false;
                cancelAnimationFrame(frame);
                observer?.disconnect();
              },
            };
          },
        }),
      ];
    },
  });
}
