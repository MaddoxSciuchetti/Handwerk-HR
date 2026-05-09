import Profile from '@/features/settings/profile/Profile';
import type { ProfileUpdateInput } from '@/features/settings/profile/profile.schemas';
import type { User } from '@/features/user-profile/types/auth.type';
import queryClient from '@/config/query.client';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithAppQueryClient } from 'test-unit/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const profileState = vi.hoisted(() => {
  const baseline: User = {
    id: 'user-1',
    email: 'chef@test.example',
    firstName: 'Maria',
    lastName: 'Muster',
    displayName: 'Maria M.',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  };
  return {
    baseline,
    user: { ...baseline },
  };
});

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
  },
}));

const updateProfileInformationMock = vi.hoisted(() =>
  vi.fn(async (data: ProfileUpdateInput): Promise<User> => {
    profileState.user = { ...profileState.user, ...data };
    return { ...profileState.user };
  })
);

vi.mock('@/features/auth/api/auth.api', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/auth/api/auth.api')>();
  return {
    ...actual,
    getUser: vi.fn(async () => ({ ...profileState.user })),
  };
});

vi.mock('@/features/settings/profile/profile.api', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/settings/profile/profile.api')>();
  return {
    ...actual,
    getProfilePhotoV2: vi.fn(async () => ''),
    updateProfileInformation: updateProfileInformationMock,
  };
});

function renderProfile() {
  return renderWithAppQueryClient(<Profile />);
}

describe('Settings / Profil', () => {
  beforeEach(() => {
    toastSuccess.mockClear();
    toastError.mockClear();
    updateProfileInformationMock.mockClear();
    profileState.user = { ...profileState.baseline };
    queryClient.clear();
  });

  it('saves Display Name on blur and shows the new value with success toast', async () => {
    const user = userEvent.setup();
    renderProfile();

    expect(await screen.findByRole('button', { name: 'Maria M.' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Maria M.' }));
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'Chef Alex');
    await user.tab();

    expect(updateProfileInformationMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        displayName: 'Chef Alex',
      })
    );

    expect(
      await screen.findByRole('button', { name: 'Chef Alex' })
    ).toBeInTheDocument();

    expect(toastSuccess).toHaveBeenCalledWith('Profil gespeichert.');
  });

  it('does not persist empty Vorname: shows validation toast and restores previous value', async () => {
    const user = userEvent.setup();
    renderProfile();

    expect(await screen.findByRole('button', { name: /^Maria$/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Maria$/ }));
    await user.clear(screen.getByRole('textbox'));
    await user.tab();

    expect(toastError).toHaveBeenCalledWith(
      'Muss mindestens 2 Zeichen haben'
    );
    expect(updateProfileInformationMock).not.toHaveBeenCalled();

    expect(
      screen.getByRole('button', { name: /^Maria$/ })
    ).toBeInTheDocument();
  });
});
