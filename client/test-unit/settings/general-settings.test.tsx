import { useState } from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { renderWithProviders } from 'test-unit/test-utils';
import { GeneralSettings } from '@/features/settings/general/GeneralSettings';
import { DescriptionPointsEditor } from '@/features/settings/documents/components/DescriptionPointsEditor';
import {
  getDescriptionSentences,
  saveDescriptionSentence,
} from '@/features/settings/documents/descriptionSentences.api';
import { DEFAULT_DESCRIPTION_SENTENCES } from '@shared/descriptionSentences';

vi.mock('@/features/settings/documents/descriptionSentences.api', () => ({
  descriptionSentencesKey: ['documents', 'description-sentences'],
  getDescriptionSentences: vi.fn(),
  saveDescriptionSentence: vi.fn(),
}));
vi.mock('@/features/user-profile/hooks/useAuth', () => ({
  default: () => ({ user: undefined }),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

function SharedViews() {
  const [value, setValue] = useState('');
  return (
    <>
      <GeneralSettings />
      <DescriptionPointsEditor
        label="Tätigkeiten"
        value={value}
        onChange={setValue}
        readOnly={false}
      />
    </>
  );
}

beforeEach(() => {
  vi.mocked(getDescriptionSentences)
    .mockReset()
    .mockResolvedValue([
      ...DEFAULT_DESCRIPTION_SENTENCES,
      'Bestehende Beschreibung',
    ]);
  vi.mocked(saveDescriptionSentence)
    .mockReset()
    .mockResolvedValue([
      ...DEFAULT_DESCRIPTION_SENTENCES,
      'Bestehende Beschreibung',
      'Neue Tätigkeit',
    ]);
});

it('uses the shared list and makes settings additions available in the contract', async () => {
  const user = userEvent.setup();
  renderWithProviders(<SharedViews />);
  const list = await screen.findByRole('list', {
    name: 'Gespeicherte Beschreibungen',
  });
  expect(within(list).getAllByRole('listitem')).toHaveLength(4);
  await user.type(screen.getByLabelText('Neue Beschreibung'), 'Neue Tätigkeit');
  await user.click(screen.getByRole('button', { name: 'Hinzufügen' }));
  expect(await within(list).findByText('Neue Tätigkeit')).toBeInTheDocument();
  expect(saveDescriptionSentence).toHaveBeenCalledWith(
    'Neue Tätigkeit',
    expect.anything()
  );
  expect(screen.getByLabelText('Neue Beschreibung')).toHaveValue('');
  await user.click(screen.getByRole('combobox'));
  expect(
    await screen.findByRole('option', { name: 'Neue Tätigkeit' })
  ).toBeInTheDocument();
});

it('shows additions made using the contract + button in settings immediately', async () => {
  const user = userEvent.setup();
  renderWithProviders(<SharedViews />);
  const list = await screen.findByRole('list', {
    name: 'Gespeicherte Beschreibungen',
  });
  await user.type(screen.getByRole('combobox'), 'Neue Tätigkeit');
  await user.click(screen.getByRole('button', { name: '+ für Hinzufügen' }));
  expect(await within(list).findByText('Neue Tätigkeit')).toBeInTheDocument();
});

it('prevents normalized duplicates and preserves text when saving fails', async () => {
  vi.mocked(saveDescriptionSentence).mockRejectedValue(new Error('Offline'));
  const user = userEvent.setup();
  renderWithProviders(<GeneralSettings />);
  await screen.findByRole('list');
  const input = screen.getByLabelText('Neue Beschreibung');
  await user.type(input, '  bestehende   beschreibung  ');
  expect(screen.getByRole('button', { name: 'Hinzufügen' })).toBeDisabled();
  await user.clear(input);
  await user.type(input, 'Neue Tätigkeit');
  await user.click(screen.getByRole('button', { name: 'Hinzufügen' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Hinzufügen' })).toBeEnabled()
  );
  expect(input).toHaveValue('Neue Tätigkeit');
  expect(
    screen.queryByText('Neue Tätigkeit', { selector: 'li' })
  ).not.toBeInTheDocument();
});

it('allows retrying a failed list request before adding descriptions', async () => {
  vi.mocked(getDescriptionSentences).mockRejectedValueOnce(
    new Error('Offline')
  );
  const user = userEvent.setup();
  renderWithProviders(<GeneralSettings />);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Beschreibungen konnten nicht geladen werden'
  );
  await user.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
  expect(await screen.findByRole('list')).toBeInTheDocument();
});
