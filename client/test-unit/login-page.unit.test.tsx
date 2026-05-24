import { StandardUserLogin } from '@/features/auth/components/StandardUserLogin';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MouseEventHandler, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from './test-utils';

vi.mock('@tanstack/react-router', async () => {
  const React = await import('react');
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router'
  );

  function MockLink({
    children,
    to,
    className,
    onClick,
  }: {
    children?: ReactNode;
    to: string;
    className?: string;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
  }) {
    return React.createElement(
      'a',
      { href: to, className, onClick },
      children
    );
  }

  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: MockLink,
  };
});

describe('Login page', () => {
  it('shows the Login button', () => {
    renderWithProviders(<StandardUserLogin />);

    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  });

  it('shows a password required error when submitting without password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StandardUserLogin />);

    await user.type(
      screen.getByLabelText(/Email Address/i),
      'test@example.com'
    );
    await user.click(screen.getByRole('button', { name: /Login/i }));

    expect(
      await screen.findByText(/^Password is required$/)
    ).toBeInTheDocument();
  });

  it('shows an email required error when submitting without email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StandardUserLogin />);

    await user.type(screen.getByLabelText(/Password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /Login/i }));

    expect(await screen.findByText(/^Email is required$/)).toBeInTheDocument();
  });
});
