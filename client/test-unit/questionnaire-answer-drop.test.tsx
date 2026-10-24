import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ContractDraftBody } from '@/features/worker-task-management/components/files/ContractDraftBody';
import { UnmatchedQuestionnaireAnswers } from '@/features/worker-task-management/components/files/UnmatchedQuestionnaireAnswers';
import { fromSegments } from '@/features/settings/documents/styledDocument';
import {
  getDraggedQuestionnaireAnswer,
  setDraggedQuestionnaireAnswer,
} from '@/features/worker-task-management/components/files/questionnaireAnswerDrag';
const segments = [
  { type: 'text' as const, text: 'Name: ' },
  { type: 'input' as const, key: 'name', label: 'Name' },
];
const transfer = () => ({
  setData: vi.fn(),
  setDragImage: vi.fn(),
  effectAllowed: 'uninitialized',
  dropEffect: 'none',
});
afterEach(() => act(() => setDraggedQuestionnaireAnswer(null)));
it.each([false, true])(
  'only fills a highlighted field (styled: %s)',
  async (styled) => {
    const onValueChange = vi.fn();
    const outsideDrop = vi.fn();
    render(
      <div onDrop={outsideDrop}>
        <span>Outside the fields</span>
        <ContractDraftBody
          document={styled ? fromSegments(segments) : undefined}
          segments={segments}
          values={{}}
          readOnly={false}
          acceptAnswerDrop
          onValueChange={onValueChange}
        />
      </div>
    );
    const field = await screen.findByRole('textbox', { name: 'Name' });
    const dropSpot = field.closest('[data-questionnaire-answer-drop]')!;
    act(() => setDraggedQuestionnaireAnswer({ value: 'Ada' }));
    expect(dropSpot).toHaveClass('outline-blue-400');
    const dataTransfer = transfer();
    expect(fireEvent.dragOver(field, { dataTransfer })).toBe(false);
    expect(dataTransfer.dropEffect).toBe('move');
    expect(dropSpot).toHaveClass('outline-emerald-600');
    fireEvent.dragOver(screen.getByText('Outside the fields'), {
      dataTransfer,
    });
    expect(dataTransfer.dropEffect).toBe('none');
    expect(dropSpot).not.toHaveClass('outline-emerald-600');
    fireEvent.drop(screen.getByText('Outside the fields'), { dataTransfer });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(outsideDrop).not.toHaveBeenCalled();
    act(() => setDraggedQuestionnaireAnswer({ value: 'Ada' }));
    fireEvent.dragOver(field, { dataTransfer });
    fireEvent.drop(field, { dataTransfer });
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('name', 'Ada');
    expect(outsideDrop).not.toHaveBeenCalled();
    expect(getDraggedQuestionnaireAnswer()).toBeNull();
    expect(dropSpot).not.toHaveClass('outline-emerald-600');
  }
);
it.each([false, true])(
  'rejects drops into read-only fields (styled: %s)',
  async (styled) => {
    const onValueChange = vi.fn();
    render(
      <ContractDraftBody
        document={styled ? fromSegments(segments) : undefined}
        segments={segments}
        values={{ name: 'Existing' }}
        readOnly
        acceptAnswerDrop
        onValueChange={onValueChange}
      />
    );
    const field = await screen.findByRole('textbox', { name: 'Name' });
    act(() => setDraggedQuestionnaireAnswer({ value: 'Ada' }));
    expect(field.closest('[data-questionnaire-answer-drop]')).toBeNull();
    fireEvent.drop(field, { dataTransfer: transfer() });
    expect(onValueChange).not.toHaveBeenCalled();
  }
);
it('uses a blank native image and clears the opaque preview on cancel', () => {
  render(
    <UnmatchedQuestionnaireAnswers
      answers={[{ key: 'name', label: 'Name', value: 'Ada' }]}
      saving={false}
      onEditMaster={vi.fn()}
    />
  );
  const source = screen.getByText('Ada').parentElement!;
  vi.spyOn(source, 'getBoundingClientRect').mockReturnValue({
    left: 10,
    top: 20,
    width: 240,
    height: 58,
  } as DOMRect);
  const dataTransfer = transfer();
  const event = new MouseEvent('dragstart', {
    bubbles: true,
    clientX: 30,
    clientY: 35,
  });
  Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
  fireEvent(source, event);
  const [preview, x, y] = dataTransfer.setDragImage.mock.calls[0];
  expect(preview.style.width).toBe('1px');
  expect(preview.style.height).toBe('1px');
  expect([x, y]).toEqual([0, 0]);
  fireEvent.dragEnd(source);
  expect(getDraggedQuestionnaireAnswer()).toBeNull();
});
