import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from 'react';

type Item = { id: string; top: number; height: number; cardHeight: number };
type Drag = {
  id: string;
  from: number;
  target: number;
  items: Item[];
  grab: number;
};
const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';

function targetAtPointer(current: Drag, pointer: number, origin: number) {
  const source = current.items[current.from];
  const center = pointer - origin - current.grab + source.cardHeight / 2;
  const remaining = current.items.filter((item) => item.id !== current.id);
  let top = 0;
  const centers = remaining.map((item) => {
    const center = top + item.cardHeight / 2;
    top += item.height;
    return center;
  });
  let target = current.target;
  // Settled neighbours give separate up/down thresholds, so animation cannot
  // move the drop target back underneath a stationary pointer.
  while (target < remaining.length && center > centers[target] + source.height)
    target++;
  while (target > 0 && center < centers[target - 1]) target--;
  return target;
}

function scrollParent(element: HTMLElement) {
  let parent = element.parentElement;
  while (parent) {
    if (
      /(auto|scroll)/.test(getComputedStyle(parent).overflowY) &&
      parent.scrollHeight > parent.clientHeight
    )
      return parent;
    parent = parent.parentElement;
  }
  return document.scrollingElement as HTMLElement | null;
}

export function useQuestionnaireDragPreview() {
  const rootRef = useRef<HTMLDivElement>(null);
  const active = useRef<Drag | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const frame = useRef(0);
  const pointer = useRef(0);
  const ghost = useRef<HTMLElement | null>(null);
  const landing = useRef<Map<
    string,
    { top: number; opacity: string; source: boolean }
  > | null>(null);

  useLayoutEffect(() => {
    if (drag || !landing.current) return;
    const previous = landing.current;
    landing.current = null;
    rootRef.current
      ?.querySelectorAll<HTMLElement>('[data-questionnaire-sort-item]')
      .forEach((item) => {
        const before = previous.get(item.dataset.questionnaireSortItem!);
        if (!before) return;
        const offset = before.source
          ? 0
          : before.top - item.getBoundingClientRect().top;
        if (Math.abs(offset) < 0.5 && Number(before.opacity) === 1) return;
        // Finish from the current animated position after React commits the new
        // order, so releasing halfway through a slide never snaps the cards.
        item.animate?.(
          [
            { transform: `translateY(${offset}px)`, opacity: before.opacity },
            { transform: 'translateY(0px)', opacity: 1 },
          ],
          { duration: 240, easing }
        );
      });
  }, [drag]);

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      ghost.current?.remove();
    },
    []
  );

  const stop = (committed = false) => {
    cancelAnimationFrame(frame.current);
    ghost.current?.remove();
    ghost.current = null;
    if (
      committed &&
      active.current &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      landing.current = new Map(
        Array.from(
          rootRef.current?.querySelectorAll<HTMLElement>(
            '[data-questionnaire-sort-item]'
          ) ?? []
        ).map((item) => [
          item.dataset.questionnaireSortItem!,
          {
            top: item.getBoundingClientRect().top,
            opacity: getComputedStyle(item).opacity,
            source: item.dataset.questionnaireSortItem === active.current?.id,
          },
        ])
      );
    }
    if (
      active.current &&
      !committed &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      rootRef.current
        ?.querySelectorAll<HTMLElement>('[data-questionnaire-sort-item]')
        .forEach((item) => {
          const style = getComputedStyle(item);
          item.animate?.(
            [
              { transform: style.transform, opacity: style.opacity },
              { transform: 'translateY(0px)', opacity: 1 },
            ],
            { duration: 240, easing }
          );
        });
    }
    active.current = null;
    setDrag(null);
  };

  const start = (id: string, event: DragEvent<HTMLElement>) => {
    const root = rootRef.current;
    if (!root) return;
    const origin = root.getBoundingClientRect().top;
    const items = Array.from(
      root.querySelectorAll<HTMLElement>('[data-questionnaire-sort-item]')
    ).map((item) => {
      item.getAnimations?.().forEach((animation) => animation.cancel());
      const rect = item.getBoundingClientRect();
      return {
        id: item.dataset.questionnaireSortItem!,
        top: rect.top - origin,
        height: rect.height,
        cardHeight: item.querySelector('article')!.getBoundingClientRect()
          .height,
      };
    });
    const from = items.findIndex((item) => item.id === id);
    if (from < 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const image = event.currentTarget.cloneNode(true) as HTMLElement;
    image.setAttribute('aria-hidden', 'true');
    image.style.cssText = `position:fixed;left:-10000px;top:0;width:${rect.width}px;pointer-events:none;background:var(--card,white);border-radius:16px;box-shadow:0 16px 40px #0003;`;
    document.body.append(image);
    event.dataTransfer.setDragImage?.(
      image,
      event.clientX - rect.left,
      event.clientY - rect.top
    );
    ghost.current = image;
    const session: Drag = {
      id,
      from,
      target: from,
      items,
      grab: event.clientY - rect.top,
    };
    pointer.current = event.clientY;
    active.current = session;
    setDrag(session);
    const scroller = scrollParent(root);
    let previousTime = 0;
    const tick = (time: number) => {
      ghost.current?.remove();
      ghost.current = null;
      const current = active.current;
      if (!current) return;
      if (scroller) {
        const bounds =
          scroller === document.scrollingElement
            ? { top: 0, bottom: window.innerHeight }
            : scroller.getBoundingClientRect();
        const edge = Math.min(72, (bounds.bottom - bounds.top) / 4);
        const speed =
          pointer.current < bounds.top + edge
            ? -Math.min(18, ((bounds.top + edge - pointer.current) / edge) * 18)
            : pointer.current > bounds.bottom - edge
              ? Math.min(
                  18,
                  ((pointer.current - bounds.bottom + edge) / edge) * 18
                )
              : 0;
        const elapsed = previousTime
          ? Math.min(2, (time - previousTime) / 16.67)
          : 1;
        scroller.scrollTop += speed * elapsed;
      }
      previousTime = time;
      const target = targetAtPointer(
        current,
        pointer.current,
        root.getBoundingClientRect().top
      );
      if (target !== current.target) {
        active.current = { ...current, target };
        setDrag(active.current);
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  const preview = useMemo(() => {
    if (!drag) return null;
    const source = drag.items[drag.from];
    const order = drag.items.filter((item) => item.id !== drag.id);
    order.splice(drag.target, 0, source);
    let top = 0;
    const offsets = new Map<string, number>();
    let placeholderTop = 0;
    order.forEach((item) => {
      offsets.set(item.id, top - item.top);
      if (item.id === drag.id) placeholderTop = top;
      top += item.height;
    });
    return {
      id: drag.id,
      position: drag.target + 1,
      total: drag.items.length,
      offsets,
      top: placeholderTop,
      height: source.cardHeight,
    };
  }, [drag]);

  return {
    rootRef,
    preview,
    start,
    cancel: () => stop(),
    over: (event: DragEvent) => {
      if (!active.current) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      pointer.current = event.clientY;
    },
    finish: (fallback: number, event: DragEvent) => {
      const current = active.current;
      const target =
        current && rootRef.current
          ? targetAtPointer(
              current,
              event.clientY,
              rootRef.current.getBoundingClientRect().top
            )
          : fallback;
      const index = current
        ? target > current.from
          ? target + 1
          : target
        : fallback;
      stop(true);
      return index;
    },
  };
}
