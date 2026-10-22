import WorkerEmailField from '@/features/worker-lifecycle/components/WorkerEmailField';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('worker email field', () => {
  it('shows a subtle gray input that becomes stronger on focus', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <WorkerEmailField workerId="worker-1" email="ada@team.invalid" />
      </QueryClientProvider>
    );

    const field = screen.getByRole('textbox', { name: 'E-Mail' });
    expect(field).toHaveValue('ada@team.invalid');
    expect(field).toHaveClass(
      'border-transparent',
      'bg-muted/50',
      'focus:bg-muted'
    );
    expect(field).not.toHaveClass('bg-muted');
  });
});
