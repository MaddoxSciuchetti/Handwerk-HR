import WorkerEmailField from '@/features/worker-lifecycle/components/WorkerEmailField';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('worker email field', () => {
  it('shows the address in an input before it is clicked', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <WorkerEmailField workerId="worker-1" email="ada@team.invalid" />
      </QueryClientProvider>
    );

    const field = screen.getByRole('textbox', { name: 'E-Mail' });
    expect(field).toHaveValue('ada@team.invalid');
    expect(field).toHaveClass('bg-muted');
  });
});
