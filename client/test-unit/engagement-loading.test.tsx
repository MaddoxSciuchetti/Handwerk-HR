import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import TaskManagement from '@/features/worker-task-management/components/tasks/WorkerTaskManagement';

vi.mock('@/features/worker-task-management/hooks/useTaskData', () => ({
  default: () => ({ data: undefined, isLoading: true }),
}));
vi.mock('@/features/worker-task-management/hooks/useGetWorkerFiles', () => ({
  default: () => ({ fetchFiles: [] }),
}));
vi.mock('@/features/all-tasks/hooks/useTaskSidebar', () => ({
  useTaskSidebar: () => ({
    sidebarKey: 'sidebar',
    sidebarProps: { isOpen: false, taskState: 'create', taskEditState: {} },
    openForEdit: vi.fn(),
    openForCreate: vi.fn(),
    patchTaskEditState: vi.fn(),
  }),
}));
vi.mock('@/features/all-tasks/components/TaskSidebar', () => ({
  TaskSidebar: () => null,
}));

it('keeps the engagement navigation and header mounted while switching loading tabs', () => {
  render(<TaskManagement workerId="worker-1" />);
  const header = screen.getByText('Aufgaben', {
    selector: '[data-slot="card-title"]',
  });
  const cardHeader = header.parentElement;
  expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
  expect(
    screen.getByRole('button', { name: 'Aufgabe hinzufügen' })
  ).toBeDisabled();
  fireEvent.click(screen.getByTestId('clothing-tab-button'));
  expect(
    screen.getByText('Kleidung', { selector: '[data-slot="card-title"]' })
      .parentElement
  ).toBe(cardHeader);
  expect(screen.getByTestId('open-clothing-add')).toBeDisabled();
  expect(
    screen.getByRole('columnheader', { name: 'Rückgabe' })
  ).toBeInTheDocument();
  fireEvent.click(screen.getByTestId('materials-tab-button'));
  expect(screen.getByTestId('open-materials-upload')).toBeDisabled();
  expect(
    screen.getByRole('columnheader', { name: 'Artikelnummer' })
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /^Dateien$/ }));
  expect(
    screen.getByRole('status', { name: 'Dateiordner werden geladen' })
  ).toBeInTheDocument();
  expect(
    screen.getByText('Dateien', { selector: '[data-slot="card-title"]' })
      .parentElement
  ).toBe(cardHeader);
});
