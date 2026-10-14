import { useLayoutEffect, useRef } from 'react';

const GLITTER = [
  { left: '7%', top: '32%', size: 1.5, duration: 22, delay: -4, x: 10, y: -6 },
  { left: '14%', top: '68%', size: 1.5, duration: 26, delay: -11, x: -8, y: 7 },
  { left: '21%', top: '40%', size: 2, duration: 18, delay: -2, x: 12, y: 5 },
  { left: '28%', top: '58%', size: 1.5, duration: 24, delay: -16, x: -6, y: -8 },
  { left: '34%', top: '28%', size: 1.5, duration: 28, delay: -7, x: 7, y: 9 },
  { left: '41%', top: '72%', size: 1.5, duration: 20, delay: -13, x: -11, y: -4 },
  { left: '47%', top: '46%', size: 1.5, duration: 25, delay: -1, x: 9, y: -7 },
  { left: '53%', top: '34%', size: 1.5, duration: 19, delay: -9, x: -5, y: 6 },
  { left: '59%', top: '64%', size: 2, duration: 27, delay: -18, x: 8, y: -5 },
  { left: '66%', top: '30%', size: 1.5, duration: 23, delay: -6, x: -9, y: 8 },
  { left: '72%', top: '55%', size: 1.5, duration: 21, delay: -14, x: 6, y: -9 },
  { left: '78%', top: '38%', size: 1.5, duration: 29, delay: -3, x: -7, y: 4 },
  { left: '84%', top: '70%', size: 1.5, duration: 17, delay: -12, x: 11, y: -6 },
  { left: '90%', top: '44%', size: 1.5, duration: 24, delay: -8, x: -4, y: 7 },
] as const;

function placeConfirmationFrame(frame: HTMLDivElement) {
  const cell = frame.parentElement;
  const row = cell?.closest('tr');
  if (!cell || !row) return;

  const rowBox = row.getBoundingClientRect();
  const cellBox = cell.getBoundingClientRect();
  const cellStyle = getComputedStyle(cell);
  const borderLeft = Number.parseFloat(cellStyle.borderLeftWidth) || 0;
  const borderTop = Number.parseFloat(cellStyle.borderTopWidth) || 0;

  frame.style.left = `${rowBox.left - cellBox.left - borderLeft}px`;
  frame.style.top = `${rowBox.top - cellBox.top - borderTop}px`;
  frame.style.width = `${rowBox.width}px`;
  frame.style.height = `${rowBox.height}px`;
}

export function ConfirmationTaskDecor() {
  const frameRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const row = frame?.parentElement?.closest('tr');
    if (!frame || !row) return;

    const sync = () => placeConfirmationFrame(frame);
    sync();

    const observer = new ResizeObserver(sync);
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frameRef} className="confirmation-task-decor" aria-hidden>
      <div className="confirmation-slime-body" />
      {GLITTER.map((speck) => (
        <span
          key={`${speck.left}-${speck.top}`}
          className="confirmation-glitter"
          style={{
            left: speck.left,
            top: speck.top,
            width: speck.size,
            height: speck.size,
            animationDuration: `${speck.duration}s`,
            animationDelay: `${speck.delay}s`,
            ['--glitter-x' as string]: `${speck.x}px`,
            ['--glitter-y' as string]: `${speck.y}px`,
          }}
        />
      ))}
      <div className="confirmation-slime-outline">
        <div className="confirmation-slime-spin" />
      </div>
    </div>
  );
}
