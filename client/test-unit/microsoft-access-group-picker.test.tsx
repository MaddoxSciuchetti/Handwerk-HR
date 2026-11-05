import { MicrosoftAccessGroupPicker } from '@/features/worker-task-management/components/tasks/MicrosoftAccessGroupPicker';
import { renderWithProviders } from './test-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

  it('allows selecting multiple groups without requiring a choice', async () => {
    const onChange = vi.fn();
    const { rerender } = renderWithProviders(
      <MicrosoftAccessGroupPicker selectedIds={[]} onChange={onChange} />
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Handwerk')).toBeInTheDocument()
    );
    await userEvent.click(screen.getByLabelText('Handwerk'));
    expect(onChange).toHaveBeenCalledWith(['group-field']);

    rerender(
      <MicrosoftAccessGroupPicker
        selectedIds={['group-field']}
        onChange={onChange}
      />
    );
    await userEvent.click(screen.getByLabelText('Büro'));
    expect(onChange).toHaveBeenCalledWith(['group-field', 'group-office']);
  });
});
