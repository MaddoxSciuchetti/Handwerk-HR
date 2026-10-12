import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

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
      (top + block.height > bottom + 1 && top > page * pitch + 1)
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
            let alive = true;
            const measure = () => {
              frame = 0;
              const layout = getLayout();
              if (!layout.enabled || !alive) return;
              const px = 96 / 25.4;
              const body = (layout.height - layout.top - layout.bottom) * px;
              const pitch = layout.height * px + 32;
              const origin = view.dom.getBoundingClientRect().top;
              const spacers = Array.from(
                view.dom.querySelectorAll<HTMLElement>('[data-editor-page-gap]')
              );
              const blocks: PageBlock[] = [];
              view.state.doc.forEach((node, offset) => {
                const add = (pos: number, isBreak = false) => {
                  const element = view.nodeDOM(pos);
                  if (!(element instanceof HTMLElement)) return;
                  const rect = element.getBoundingClientRect();
                  const prior = spacers.reduce(
                    (sum, spacer) =>
                      Number(spacer.dataset.position) <= pos
                        ? sum + Number(spacer.dataset.height)
                        : sum,
                    0
                  );
                  blocks.push({
                    pos,
                    top: (rect.top - origin) / layout.zoom - prior,
                    height: isBreak ? 0 : rect.height / layout.zoom,
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
              update: schedule,
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
