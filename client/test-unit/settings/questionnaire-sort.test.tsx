import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  QuestionnaireStack,
  type DragPayload,
} from '@/features/settings/questionnaire/QuestionnaireStack';
import {
  blocksFromItems,
  itemsFromBlocks,
} from '@/features/settings/questionnaire/questionnaireBlocks';
import type { TemplateItem } from '@/features/settings/questionnaire/questionnaireTemplate.types';

const initial: TemplateItem[] = ['Alpha', 'Beta', 'Gamma'].map((label) => ({
  kind: 'field',
  key: label,
  label,
  section: 'Fragen',
  type: 'text',
  builtin: false,
}));
const heights: Record<string, number> = { Alpha: 100, Beta: 180, Gamma: 80 };
let frames: Map<number, FrameRequestCallback>;
let nextId: number;
let rects: ReturnType<typeof vi.spyOn>;
const drop = vi.fn();
function Harness({ scroll = false }: { scroll?: boolean }) {
  const [items, setItems] = useState(initial);
  return (
    <div
      data-testid="scroll"
      style={scroll ? { overflowY: 'auto', height: 300 } : undefined}
    >
      <QuestionnaireStack
        blocks={blocksFromItems(items)}
        contractFields={[]}
        onDrop={(index: number, payload: DragPayload) => {
          drop(index, payload);
          const blocks = blocksFromItems(items);
          const from = blocks.findIndex((block) => block.id === payload.id);
          const [moved] = blocks.splice(from, 1);
          blocks.splice(from < index ? index - 1 : index, 0, moved);
          setItems(itemsFromBlocks(blocks));
        }}
        onInsert={vi.fn()}
        onChangeField={vi.fn()}
        onCommitField={vi.fn()}
        onRemove={vi.fn()}
      />
    </div>
  );
}
const card = (id: string) =>
  document.querySelector<HTMLElement>(
    `[data-questionnaire-sort-item="${id}"] article`
  )!;
const item = (id: string) => card(id).parentElement!;
const dt = () => {
  const values = new Map<string, string>();
  return {
    setData: (type: string, value: string) => values.set(type, value),
    getData: (type: string) => values.get(type) ?? '',
    setDragImage: vi.fn(),
    effectAllowed: '',
    dropEffect: '',
  };
};
function dragEvent(
  target: Element,
  type: string,
  clientY: number,
  dataTransfer: ReturnType<typeof dt>
) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientY,
    clientX: 20,
  });
  Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
  fireEvent(target, event);
  return event;
}
function frame() {
  act(() => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => callback(16));
  });
}
beforeEach(() => {
  frames = new Map();
  nextId = 0;
  drop.mockClear();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextId, callback);
    return nextId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  rects = vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: HTMLElement) {
      const wrapper = this.closest<HTMLElement>(
        '[data-questionnaire-sort-item]'
      );
      let top = 0;
      let height = 528;
      if (wrapper) {
        const siblings = [
          ...wrapper.parentElement!.querySelectorAll<HTMLElement>(
            '[data-questionnaire-sort-item]'
          ),
        ];
        const index = siblings.indexOf(wrapper);
        top = siblings
          .slice(0, index)
          .reduce(
            (sum, sibling) =>
              sum + heights[sibling.dataset.questionnaireSortItem!] + 56,
            0
          );
        height =
          heights[wrapper.dataset.questionnaireSortItem!] +
          (this === wrapper ? 56 : 0);
      } else if (this.dataset.testid === 'scroll') height = 300;
      return {
        top,
        bottom: top + height,
        left: 0,
        right: 600,
        width: 600,
        height,
        x: 0,
        y: top,
        toJSON: () => ({}),
      };
    });
});
afterEach(() => {
  cleanup();
  rects.mockRestore();
  vi.unstubAllGlobals();
});

it('opens a full-height gap, moves neighbours smoothly, and commits the previewed position on drop', () => {
  render(<Harness />);
  const transfer = dt();
  dragEvent(card('Alpha'), 'dragstart', 20, transfer);
  const preview = document.querySelector<HTMLElement>(
    '[data-questionnaire-drop-preview]'
  )!;
  expect(preview.style.height).toBe('100px');
  expect(Number(item('Alpha').style.opacity)).toBeLessThan(0.01);
  dragEvent(card('Beta'), 'dragover', 300, transfer);
  frame();
  expect(screen.getByRole('status')).toHaveTextContent('Position 2 von 3');
  expect(item('Beta').style.transform).toBe('translateY(-156px)');
  expect(preview.style.transform).toBe('translateY(236px)');
  for (let index = 0; index < 5; index++) {
    dragEvent(card('Beta'), 'dragover', 300, transfer);
    frame();
    expect(screen.getByRole('status')).toHaveTextContent('Position 2 von 3');
  }
  dragEvent(card('Beta'), 'drop', 300, transfer);
  expect(drop).toHaveBeenCalledExactlyOnceWith(2, {
    source: 'stack',
    id: 'Alpha',
  });
  expect(
    [
      ...document.querySelectorAll<HTMLElement>(
        '[data-questionnaire-sort-item]'
      ),
    ].map((element) => element.dataset.questionnaireSortItem)
  ).toEqual(['Beta', 'Alpha', 'Gamma']);
  expect(
    document.querySelector('[data-questionnaire-drop-preview]')
  ).not.toBeInTheDocument();
  expect(item('Alpha').style.transform).toBe('');
  expect(frames.size).toBe(0);
});

it('supports moving the last question to the beginning and does not mutate order when cancelled', () => {
  render(<Harness />);
  const transfer = dt();
  dragEvent(card('Gamma'), 'dragstart', 410, transfer);
  dragEvent(card('Alpha'), 'dragover', 0, transfer);
  frame();
  expect(screen.getByRole('status')).toHaveTextContent('Position 1 von 3');
  expect(item('Alpha').style.transform).toBe('translateY(136px)');
  dragEvent(card('Gamma'), 'dragend', 0, transfer);
  expect(drop).not.toHaveBeenCalled();
  expect(item('Alpha').style.transform).toBe('');
  expect(
    document.querySelector('[data-questionnaire-drop-preview]')
  ).not.toBeInTheDocument();
  dragEvent(card('Gamma'), 'dragstart', 410, transfer);
  dragEvent(card('Alpha'), 'dragover', 0, transfer);
  frame();
  dragEvent(card('Alpha'), 'drop', 0, transfer);
  expect(drop).toHaveBeenCalledExactlyOnceWith(0, {
    source: 'stack',
    id: 'Gamma',
  });
});

it('keeps controls editable and scrolls long lists near their edge', () => {
  render(<Harness scroll />);
  const transfer = dt();
  const input = card('Alpha').querySelector('input')!;
  expect(dragEvent(input, 'dragstart', 20, transfer).defaultPrevented).toBe(
    true
  );
  expect(
    document.querySelector('[data-questionnaire-drop-preview]')
  ).not.toBeInTheDocument();
  const scroller = screen.getByTestId('scroll');
  Object.defineProperties(scroller, {
    scrollHeight: { value: 1000 },
    clientHeight: { value: 300 },
  });
  dragEvent(card('Alpha'), 'dragstart', 20, transfer);
  dragEvent(card('Beta'), 'dragover', 290, transfer);
  frame();
  expect(scroller.scrollTop).toBeGreaterThan(0);
  dragEvent(card('Alpha'), 'dragend', 290, transfer);
  expect(frames.size).toBe(0);
});

it('uses the final pointer position for a quick drop before another animation frame', () => {
  render(<Harness />);
  const transfer = dt();
  dragEvent(card('Alpha'), 'dragstart', 20, transfer);
  dragEvent(card('Gamma'), 'dragover', 500, transfer);
  dragEvent(card('Gamma'), 'drop', 500, transfer);
  expect(drop).toHaveBeenCalledExactlyOnceWith(3, {
    source: 'stack',
    id: 'Alpha',
  });
  expect(
    [
      ...document.querySelectorAll<HTMLElement>(
        '[data-questionnaire-sort-item]'
      ),
    ].map((element) => element.dataset.questionnaireSortItem)
  ).toEqual(['Beta', 'Gamma', 'Alpha']);
  expect(frames.size).toBe(0);
});

it('removes the drag image and animation loop if the stack unmounts during dragging', () => {
  const view = render(<Harness />);
  const transfer = dt();
  dragEvent(card('Alpha'), 'dragstart', 20, transfer);
  expect(
    document.querySelector('[aria-hidden="true"][style*="-10000px"]')
  ).toBeInTheDocument();
  view.unmount();
  expect(frames.size).toBe(0);
  expect(
    document.querySelector('[aria-hidden="true"][style*="-10000px"]')
  ).not.toBeInTheDocument();
});

it('finishes an in-progress neighbour animation when the pointer is released', () => {
  render(<Harness />);
  const transfer = dt();
  dragEvent(card('Alpha'), 'dragstart', 20, transfer);
  dragEvent(card('Beta'), 'dragover', 300, transfer);
  frame();
  const beta = item('Beta');
  const getRect = rects.getMockImplementation()!;
  Object.defineProperty(beta, 'getBoundingClientRect', {
    configurable: true,
    value: () => {
      const rect = getRect.call(beta) as DOMRect;
      return beta.parentElement?.dataset.sorting === 'true'
        ? { ...rect, top: 78, bottom: 78 + rect.height, y: 78 }
        : rect;
    },
  });
  const animate = vi.fn();
  Object.defineProperty(beta, 'animate', {
    value: animate,
    configurable: true,
  });
  dragEvent(card('Beta'), 'drop', 300, transfer);
  expect(animate).toHaveBeenCalledWith(
    [
      { transform: 'translateY(78px)', opacity: '1' },
      { transform: 'translateY(0px)', opacity: 1 },
    ],
    expect.objectContaining({ duration: 240 })
  );
});
