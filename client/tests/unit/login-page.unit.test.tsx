import { LoginComponent } from '@/features/auth/components/Login';
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

describe('Login page', () => {
  it('shows the Login button', () => {
    renderWithProviders(<LoginComponent />);

    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  });

  it('shows a password required error when submitting without password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginComponent />);

    await user.type(
      screen.getByLabelText(/Email Address/i),
      'test@example.com'
    );
    await user.click(screen.getByRole('button', { name: /Login/i }));

    expect(await screen.findByText('Password is required')).toBeInTheDocument();
  });

  it('shows a email required error when submitting without email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginComponent />);

    await user.type(screen.getByLabelText(/Password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /Login/i }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
  });
});
