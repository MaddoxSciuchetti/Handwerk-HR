import { useLayoutEffect, useRef } from 'react';

type RingEdge = 'top' | 'right' | 'bottom' | 'left';
type ParticleKind = 'dot' | 'spark' | 'star';

type RingParticle = {
  edge: RingEdge;
  along: string;
  across: string;
  size: number;
  duration: number;
  delay: number;
  travel: number;
  kind: ParticleKind;
  hue: number;
};

const EDGES: RingEdge[] = ['top', 'right', 'bottom', 'left'];
const KINDS: ParticleKind[] = ['dot', 'spark', 'dot', 'star', 'spark'];
const HUES = [300, 285, 318, 292, 276, 326];
const SIZES = [0.6, 0.9, 1.1, 1.4, 1.8, 2.2];

function buildRingParticles(): RingParticle[] {
  const particles: RingParticle[] = [];
  let n = 0;
  for (const edge of EDGES) {
    const count = edge === 'top' || edge === 'bottom' ? 46 : 14;
    for (let index = 0; index < count; index += 1) {
      n += 1;
      const along = 3 + ((index * 29 + n * 11) % 94);
      particles.push({
        edge,
        along: `${along}%`,
        across: `${(n % 5) * 0.7}px`,
        size: SIZES[n % SIZES.length],
        duration: 6 + (n % 11) * 0.8,
        delay: -((n * 1.3) % 14),
        travel: (n % 2 === 0 ? 1 : -1) * (10 + (n % 16)),
        kind: KINDS[n % KINDS.length],
        hue: HUES[n % HUES.length],
      });
    }
  }
  return particles;
}

const RING_PARTICLES = buildRingParticles();

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
      <div className="confirmation-slime-outline">
        <div className="confirmation-slime-spin" />
        <div className="confirmation-ring-dust" />
        {RING_PARTICLES.map((particle) => (
          <span
            key={`${particle.edge}-${particle.along}-${particle.delay}`}
            className="confirmation-particle"
            data-edge={particle.edge}
            data-kind={particle.kind}
            style={{
              ['--along' as string]: particle.along,
              ['--across' as string]: particle.across,
              ['--travel' as string]: `${particle.travel}px`,
              width: particle.size,
              height: particle.size,
              color: `oklch(0.99 0.05 ${particle.hue})`,
              background: '#fff',
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
