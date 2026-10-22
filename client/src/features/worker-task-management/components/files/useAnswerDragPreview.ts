import { useEffect, useRef, type DragEvent } from 'react';

export function useAnswerDragPreview() {
  const preview = useRef<HTMLElement | null>(null);
  const nativeImage = useRef<HTMLElement | null>(null);

  const stop = () => {
    preview.current?.remove();
    preview.current = null;
    nativeImage.current?.remove();
    nativeImage.current = null;
  };

  useEffect(() => {
    const move = (event: globalThis.DragEvent) => {
      if (!preview.current) return;
      // Keep the pointer clear so even small inline fields remain easy to hit.
      preview.current.style.left = `${event.clientX + 12}px`;
      preview.current.style.top = `${event.clientY + 12}px`;
    };
    document.addEventListener('dragover', move, true);
    document.addEventListener('drop', stop, true);
    document.addEventListener('dragend', stop, true);
    return () => {
      document.removeEventListener('dragover', move, true);
      document.removeEventListener('drop', stop, true);
      document.removeEventListener('dragend', stop, true);
      stop();
    };
  }, []);

  const start = (event: DragEvent<HTMLElement>) => {
    stop();
    const card = event.currentTarget.cloneNode(true) as HTMLElement;
    card.removeAttribute('draggable');
    card.setAttribute('aria-hidden', 'true');
    card.inert = true;
    card.style.cssText = `position:fixed;left:${event.clientX + 12}px;top:${event.clientY + 12}px;width:180px;max-width:calc(100vw - 24px);pointer-events:none;z-index:10000;opacity:1;background:var(--card,white);color:var(--card-foreground,black);padding:6px 8px;box-shadow:0 4px 12px #0003;`;
    const label = card.children[0] as HTMLElement;
    const value = card.children[1] as HTMLElement;
    label.style.cssText =
      'font-size:10px;line-height:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    value.style.cssText =
      'font-size:12px;line-height:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    document.body.append(card);
    preview.current = card;

    // Native drag images are translucent regardless of the card's opacity.
    // Replace that image with a blank and display the opaque DOM card instead.
    const blank = document.createElement('div');
    blank.style.cssText =
      'position:fixed;left:0;top:0;width:1px;height:1px;pointer-events:none;';
    document.body.append(blank);
    event.dataTransfer.setDragImage?.(blank, 0, 0);
    nativeImage.current = blank;
  };

  return { start, stop };
}
