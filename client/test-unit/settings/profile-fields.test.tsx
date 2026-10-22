import { EditableTextRow } from '@/features/settings/profile/EditableTextRow';
import Profile from '@/features/settings/profile/Profile';
import { Table, TableBody } from '@/components/ui/table';
import { render, screen } from '@testing-library/react';
import { renderWithProviders } from 'test-unit/test-utils';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));

vi.mock('sonner', () => ({
  toast: { error: toastError, success: vi.fn() },
}));

vi.mock('@/features/settings/employees/Employees', () => ({
  default: () => null,
}));

vi.mock('@/features/settings/profile/useProfileSettings', () => ({
  useProfileSettings: () => ({
    user: {
      displayName: '',
      firstName: 'Maddox',
      lastName: 'Sciuchetti',
      email: 'maddox@firma.de',
    },
    isLoading: false,
    isError: false,
    saveProfile: vi.fn(),
    profilePhoto: '',
    uploadPhoto: vi.fn(),
    isSaving: false,
    isUploadingPhoto: false,
  }),
}));

describe('profile settings fields', () => {
  it('shows a subtle gray input that becomes stronger on focus', () => {
    render(
      <Table>
        <TableBody>
          <EditableTextRow
            label="Email Adresse"
            type="email"
            value="ada@firma.de"
            onChangeValue={() => undefined}
            onBlur={() => undefined}
          />
        </TableBody>
      </Table>
    );

    const field = screen.getByRole('textbox', { name: 'Email Adresse' });
    expect(field).toHaveValue('ada@firma.de');
    expect(field).toHaveClass(
      'border-transparent',
      'bg-muted/50',
      'focus:bg-muted'
    );
    expect(field).not.toHaveClass('bg-muted');
  });

  it('does not validate when an empty display name is only clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />);

    const field = screen.getByRole('textbox', { name: 'Display Name' });
    await user.click(field);
    field.blur();

    expect(toastError).not.toHaveBeenCalled();
    expect(field).toHaveValue('');
  });
});
