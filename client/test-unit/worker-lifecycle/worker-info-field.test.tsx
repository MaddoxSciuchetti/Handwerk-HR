import API from '@/config/apiClient';
import WorkerEmailField from '@/features/worker-lifecycle/components/WorkerEmailField';
import WorkerInfoField from '@/features/worker-lifecycle/components/WorkerInfoField';
import type { WorkerEngagementInfoItem } from '@/features/worker-lifecycle/consts/worker-engagement-info.consts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

function show(item: WorkerEngagementInfoItem) {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      }
    >
      <WorkerInfoField workerId="worker-1" item={item} />
    </QueryClientProvider>
  );
  return screen.getByLabelText(item.label);
}

afterEach(() => vi.restoreAllMocks());

describe('worker info editing', () => {
  it.each([
    [
      { label: 'Vorname', value: 'Ada', editable: 'firstName', required: true },
      ' Grace ',
      { firstName: 'Grace' },
    ],
    [
      { label: 'Postleitzahl', value: '', editable: 'postalCode' },
      '01234',
      { postalCode: '01234' },
    ],
    [
      {
        label: 'Geburtsdatum',
        value: '',
        editable: 'birthday',
        inputType: 'date',
      },
      '1990-03-12',
      { birthday: '1990-03-12T00:00:00.000Z' },
    ],
    [
      {
        label: 'Austrittsdatum',
        value: '2026-10-24',
        editable: 'exitDate',
        inputType: 'date',
      },
      '',
      { exitDate: null },
    ],
    [
      {
        label: 'Hosengröße',
        value: '',
        editable: 'workwearSize',
        itemName: 'Hose',
      },
      'M',
      { workwearSize: { itemName: 'Hose', size: 'M' } },
    ],
  ] as const)(
    'persists $0.label to its own data field',
    async (item, value, payload) => {
      const put = vi.spyOn(API, 'put').mockResolvedValue({ data: {} });
      const input = show(item);
      fireEvent.change(input, { target: { value } });
      fireEvent.blur(input);
      await waitFor(() =>
        expect(put).toHaveBeenCalledWith('/worker/worker-1', payload)
      );
    }
  );

  it('updates phase on the displayed engagement', async () => {
    const put = vi.spyOn(API, 'put').mockResolvedValue({ data: {} });
    const input = show({
      label: 'Phase',
      value: 'onboarding',
      editable: 'phase',
      engagementId: 'engagement-1',
    });
    fireEvent.change(input, { target: { value: 'transfer' } });
    fireEvent.blur(input);
    await waitFor(() =>
      expect(put).toHaveBeenCalledWith(
        '/worker/worker-1/engagements/engagement-1',
        { type: 'transfer' }
      )
    );
  });

  it('rejects an empty required name', () => {
    const put = vi.spyOn(API, 'put');
    const input = show({
      label: 'Nachname',
      value: 'Lovelace',
      editable: 'lastName',
      required: true,
    });
    fireEvent.change(input, { target: { value: ' ' } });
    fireEvent.blur(input);
    expect(screen.getByRole('alert')).toHaveTextContent('Erforderlich');
    expect(put).not.toHaveBeenCalled();
  });

  it('restores the saved value on Escape without saving', () => {
    const put = vi.spyOn(API, 'put');
    const input = show({
      label: 'Position',
      value: 'Elektrikerin',
      editable: 'position',
    });
    input.focus();
    fireEvent.change(input, { target: { value: 'Other' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveValue('Elektrikerin');
    expect(put).not.toHaveBeenCalled();
  });

  it('shows a failed save and keeps the draft for retry', async () => {
    vi.spyOn(API, 'put').mockRejectedValue(new Error('Failed'));
    const input = show({ label: 'Ort', value: '', editable: 'city' });
    fireEvent.change(input, { target: { value: 'Berlin' } });
    fireEvent.blur(input);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ort konnte nicht gespeichert werden.'
    );
    expect(input).toHaveValue('Berlin');
  });
});

describe('fast automatic saves', () => {
  it.each(['details', 'email'] as const)(
    'keeps %s usable after saving while refresh continues in the background',
    async (kind) => {
      const client = new QueryClient();
      const refresh = vi
        .spyOn(client, 'invalidateQueries')
        .mockImplementation(() => new Promise<void>(() => {}));
      let finishSave!: () => void;
      const put = vi.spyOn(API, 'put').mockImplementation(
        () =>
          new Promise((resolve) => {
            finishSave = () => resolve({ data: {} });
          })
      );
      render(
        <QueryClientProvider client={client}>
          {kind === 'details' ? (
            <WorkerInfoField
              workerId="worker-1"
              item={{ label: 'Ort', value: '', editable: 'city' }}
            />
          ) : (
            <WorkerEmailField workerId="worker-1" email="" field="workEmail" />
          )}
        </QueryClientProvider>
      );
      const input = screen.getByRole('textbox');
      expect(input).not.toHaveAttribute('placeholder');
      fireEvent.change(input, {
        target: {
          value: kind === 'details' ? 'Berlin' : 'ada@team.onmicrosoft.com',
        },
      });
      fireEvent.blur(input);
      await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(input).toBeDisabled());
      finishSave();
      await waitFor(() => expect(refresh).toHaveBeenCalled());
      await waitFor(() => expect(input).toBeEnabled());
    }
  );
});
