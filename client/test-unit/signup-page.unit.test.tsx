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

//  Password satisfies `registerPasswordSchema` in auth.schemas.ts
const VALID_SIGNUP_PASSWORD = 'StrongP@ss1';

async function fillValidSignupStepOne(
  user: ReturnType<typeof userEvent.setup>
) {
  await user.type(screen.getByLabelText(/^Display Name$/i), 'Test User');
  await user.type(screen.getByLabelText(/Email Address/i), 'newco@example.com');
  await user.type(screen.getByLabelText(/^Vorname$/i), 'Test');
  await user.type(screen.getByLabelText(/^Nachname$/i), 'User');
  await user.type(screen.getByLabelText(/^Password$/i), VALID_SIGNUP_PASSWORD);
  await user.type(
    screen.getByLabelText(/Confirm Password/i),
    VALID_SIGNUP_PASSWORD
  );
}

describe('Signup page', () => {
  it('shows Continue on step one, then company fields and Create Account after valid user details', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignupForm />);

    expect(
      screen.getByRole('button', { name: /Continue/i })
    ).toBeInTheDocument();

    await fillValidSignupStepOne(user);
    await user.click(screen.getByRole('button', { name: /Continue/i }));

    expect(
      screen.getByRole('button', { name: /Create Account/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Company Name$/i)).toBeInTheDocument();
  });

  it('shows a password required error when continuing without password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignupForm />);

    await user.type(
      screen.getByLabelText(/Email Address/i),
      'test@example.com'
    );

    await user.click(screen.getByRole('button', { name: /Continue/i }));

    expect(
      await screen.findByText(/^Password is required$/)
    ).toBeInTheDocument();
  });

  it('shows an email required error when continuing without email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignupForm />);

    await user.click(screen.getByRole('button', { name: /Continue/i }));

    expect(await screen.findByText(/^Email is required$/)).toBeInTheDocument();
  });

  it('shows company name required when submitting step two without company name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignupForm />);

    await fillValidSignupStepOne(user);
    await user.click(screen.getByRole('button', { name: /Continue/i }));

    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(
      await screen.findByText(/^Company name is required$/)
    ).toBeInTheDocument();
  });
});
