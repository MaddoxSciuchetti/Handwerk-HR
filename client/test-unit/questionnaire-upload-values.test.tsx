import { apiJson } from '@/config/apiClient';
import { QuestionnaireForm } from '@/features/questionnaire/QuestionnaireForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

vi.mock('@/config/apiClient', () => ({
  apiJson: { get: vi.fn(), post: vi.fn() },
}));

it.each(['success', 'failure'] as const)(
  'keeps earlier answers during a file upload and background refresh (%s)',
  async (outcome) => {
    vi.mocked(apiJson.get)
      .mockReset()
      .mockResolvedValue({
        success: true,
        data: {
          status: 'sent',
          items: [
            {
              kind: 'field',
              key: 'lastName',
              label: 'Familienname',
              section: 'Person',
              type: 'text',
            },
            {
              kind: 'field',
              key: 'sex',
              label: 'Geschlecht',
              section: 'Person',
              type: 'single',
              options: ['divers', 'weiblich'],
            },
            {
              kind: 'field',
              key: 'employer',
              label: 'Betrieb',
              section: 'Person',
              type: 'text',
              defaultValue: 'BSB',
            },
            {
              kind: 'repeater',
              key: 'rows.children',
              section: 'Kinder',
              columns: [{ key: 'name', label: 'Kind', type: 'text' }],
            },
            {
              kind: 'field',
              key: 'attachment',
              label: 'Nachweis',
              section: 'Dateien',
              type: 'file',
            },
          ],
        },
      });
    let finishUpload!: () => void;
    const fileValue = JSON.stringify({
      name: 'nachweis.pdf',
      key: 'questionnaires/submission/file.pdf',
    });
    const upload = new Promise((resolve, reject) => {
      finishUpload = () =>
        outcome === 'success'
          ? resolve({ success: true, data: { value: fileValue } })
          : reject(new Error('Upload failed'));
    });
    vi.mocked(apiJson.post)
      .mockReset()
      .mockImplementation((url) =>
        url.endsWith('/file')
          ? (upload as ReturnType<typeof apiJson.post>)
          : Promise.resolve({ success: true, data: { status: 'completed' } })
      );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={client}>
        <QuestionnaireForm token="token" />
      </QueryClientProvider>
    );

    await user.type(await screen.findByLabelText('Familienname'), 'Muster');
    await user.click(screen.getByRole('radio', { name: 'divers' }));
    await user.type(screen.getByLabelText('Kind Zeile 1'), 'Alex');
    await user.click(
      screen.getByRole('checkbox', {
        name: /Erklärung der beschäftigten Person/,
      })
    );
    await user.upload(
      screen.getByLabelText('Nachweis'),
      new File(['pdf'], 'nachweis.pdf', { type: 'application/pdf' })
    );
    expect(screen.getByRole('button', { name: 'Absenden' })).toBeDisabled();

    // Returning from a file picker can trigger a background query refresh.
    await act(async () => {
      await client.refetchQueries({ queryKey: ['fragebogen', 'token'] });
    });
    expect(apiJson.get).toHaveBeenCalledTimes(2);
    // Edits made while the upload is pending must survive its completion too.
    await user.type(screen.getByLabelText('Familienname'), 'mann');
    await act(async () => {
      finishUpload();
      await upload.catch(() => undefined);
    });
    if (outcome === 'success') {
      expect(await screen.findByText('nachweis.pdf')).toBeVisible();
    } else {
      expect(
        await screen.findByText('Die Datei konnte nicht hochgeladen werden.')
      ).toBeVisible();
    }
    expect(screen.getByLabelText('Familienname')).toHaveValue('Mustermann');
    expect(screen.getByRole('radio', { name: 'divers' })).toBeChecked();
    expect(screen.getByLabelText('Betrieb')).toHaveValue('BSB');
    expect(screen.getByLabelText('Kind Zeile 1')).toHaveValue('Alex');
    expect(
      screen.getByRole('checkbox', {
        name: /Erklärung der beschäftigten Person/,
      })
    ).toBeChecked();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Absenden' })).toBeEnabled()
    );
    await user.click(screen.getByRole('button', { name: 'Absenden' }));
    await screen.findByText('Danke, Ihre Angaben wurden übermittelt.');
    expect(apiJson.post).toHaveBeenLastCalledWith(
      'fragebogen/token',
      expect.objectContaining({
        lastName: 'Mustermann',
        sex: 'divers',
        employer: 'BSB',
        declaration: 'ja',
        'rows.children': [{ name: 'Alex' }],
        attachment: outcome === 'success' ? fileValue : '',
      })
    );
    client.clear();
  }
);
