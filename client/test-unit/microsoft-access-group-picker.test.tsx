import { MicrosoftAccessGroupPicker } from '@/features/worker-task-management/components/tasks/MicrosoftAccessGroupPicker';
import { renderWithProviders } from './test-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getMicrosoftAccessGroups: vi.fn(),
}));

vi.mock(
  '@/features/worker-task-management/api/microsoftAccessGroups.api',
  () => ({
    getMicrosoftAccessGroups: mocks.getMicrosoftAccessGroups,
  })
);

describe('MicrosoftAccessGroupPicker', () => {
  beforeEach(() => {
    mocks.getMicrosoftAccessGroups.mockResolvedValue({
      groups: [
        { id: 'group-field', displayName: 'Handwerk' },
        { id: 'group-office', displayName: 'Büro' },
      ],
      error: null,
    });
  });

  it('loads groups in a dropdown without requiring a choice', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <MicrosoftAccessGroupPicker selectedIds={[]} onChange={onChange} />
    );
    const trigger = await screen.findByRole('combobox', {
      name: 'Microsoft-Gruppe',
    });
    await userEvent.click(trigger);
    await waitFor(() =>
      expect(
        screen.getByRole('option', { name: 'Handwerk' })
      ).toBeInTheDocument()
    );
    await userEvent.click(screen.getByRole('option', { name: 'Handwerk' }));
    expect(onChange).toHaveBeenCalledWith(['group-field']);
  });
});
