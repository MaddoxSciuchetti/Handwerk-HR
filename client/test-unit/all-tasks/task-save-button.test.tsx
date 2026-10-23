import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { TaskSaveButton } from '@/features/all-tasks/components/TaskSaveButton';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('shows the spinner as soon as an edit is pending and keeps fast saves visible', () => {
  const onSave = vi.fn().mockResolvedValue(true);
  const view = render(<TaskSaveButton state="saved" onSave={onSave} />);
  expect(screen.getByRole('button', { name: 'Speichern' })).toHaveTextContent(
    'Speichern'
  );
  view.rerender(<TaskSaveButton state="pending" onSave={onSave} />);
  expect(
    screen.getByRole('status', { name: 'Wird gespeichert' })
  ).toBeVisible();
  expect(screen.getByRole('button')).not.toHaveTextContent('Speichern');
  view.rerender(<TaskSaveButton state="saving" onSave={onSave} />);
  expect(screen.getByRole('button')).toBeDisabled();
  view.rerender(<TaskSaveButton state="saved" onSave={onSave} />);
  act(() => vi.advanceTimersByTime(299));
  expect(screen.getByRole('status')).toBeVisible();
  act(() => vi.advanceTimersByTime(1));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));
  expect(onSave).toHaveBeenCalledOnce();
});

it.each(['invalid', 'error'] as const)(
  'stops the spinner for %s input and permits saving again',
  (state) => {
    const onSave = vi.fn().mockResolvedValue(true);
    const view = render(<TaskSaveButton state="pending" onSave={onSave} />);
    view.rerender(<TaskSaveButton state={state} onSave={onSave} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('Speichern');
    expect(screen.getByRole('button')).toBeEnabled();
  }
);
