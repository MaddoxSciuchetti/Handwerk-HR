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

  it('allows selecting multiple groups from a dropdown without requiring a choice', async () => {
    const onChange = vi.fn();
    const { rerender } = renderWithProviders(
      <MicrosoftAccessGroupPicker selectedIds={[]} onChange={onChange} />
    );
    const trigger = await screen.findByRole('button', {
      name: 'Microsoft-Gruppen',
    });
    expect(trigger).toHaveTextContent('Gruppen auswählen');
    expect(
      screen.getByRole('button', { name: 'Hinweis zu Microsoft-Gruppen' })
    ).toBeInTheDocument();
    await userEvent.click(trigger);

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
    expect(
      screen.getByRole('button', { name: 'Microsoft-Gruppen' })
    ).toHaveTextContent('Handwerk');

    await userEvent.click(screen.getByLabelText('Büro'));
    expect(onChange).toHaveBeenCalledWith(['group-field', 'group-office']);
  });

  it('can hide the optional-groups note for required assign flows', async () => {
    renderWithProviders(
      <MicrosoftAccessGroupPicker
        selectedIds={[]}
        onChange={vi.fn()}
        showOptionalNote={false}
      />
    );
    await screen.findByRole('button', { name: 'Microsoft-Gruppen' });
    expect(
      screen.queryByRole('button', { name: 'Hinweis zu Microsoft-Gruppen' })
    ).not.toBeInTheDocument();
  });
});
