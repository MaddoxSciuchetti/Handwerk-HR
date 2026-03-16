import { SignupForm } from '@/features/auth/components/Register';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from './test-utils';

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router'
  );

  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('Signup page', () => {
  it('shows the Signup button', () => {
    renderWithProviders(<SignupForm />);

    expect(
      screen.getByRole('button', { name: /Create Account/i })
    ).toBeInTheDocument();
  });

  it('shows a password required error when submitting without password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignupForm />);

    await user.type(
      screen.getByLabelText(/Email Address/i),
      'test@example.com'
    );

    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(
      await screen.findByText(/^Password is required$/i)
    ).toBeInTheDocument();
  });

  it('shows a email is required error when submitting without email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignupForm />);

    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByText(/^Email is required$/i)).toBeInTheDocument();
  });
});
