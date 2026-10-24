import API from '@/config/apiClient';
import WorkerEmailField from '@/features/worker-lifecycle/components/WorkerEmailField';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('worker email field', () => {
  afterEach(() => vi.restoreAllMocks());
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

describe('work email editing', () => {
  afterEach(() => vi.restoreAllMocks());

  it('saves an existing Microsoft address without changing the personal email', async () => {
    const put = vi.spyOn(API, 'put').mockResolvedValue({ data: {} });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <WorkerEmailField workerId="worker-1" email="" field="workEmail" />
      </QueryClientProvider>
    );
    const field = screen.getByRole('textbox', { name: 'Arbeits-E-Mail' });
    fireEvent.change(field, {
      target: { value: ' Ada@Team.onmicrosoft.com ' },
    });
    fireEvent.blur(field);
    await waitFor(() =>
      expect(put).toHaveBeenCalledWith('/worker/worker-1', {
        workEmail: 'ada@team.onmicrosoft.com',
      })
    );
  });

  it('allows clearing an optional work email', async () => {
    const put = vi.spyOn(API, 'put').mockResolvedValue({ data: {} });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <WorkerEmailField
          workerId="worker-1"
          email="ada@team.onmicrosoft.com"
          field="workEmail"
        />
      </QueryClientProvider>
    );
    const field = screen.getByRole('textbox', { name: 'Arbeits-E-Mail' });
    fireEvent.change(field, { target: { value: '' } });
    fireEvent.blur(field);
    await waitFor(() =>
      expect(put).toHaveBeenCalledWith('/worker/worker-1', { workEmail: null })
    );
  });
});
