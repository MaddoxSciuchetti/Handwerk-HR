import { useState } from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { renderWithProviders } from 'test-unit/test-utils';
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
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

function Harness({ initial = '', readOnly = false }) {
  const [value, setValue] = useState(initial);
  return (
    <DescriptionPointsEditor
      label="Tätigkeiten"
      value={value}
      readOnly={readOnly}
      onChange={setValue}
    />
  );
}
beforeEach(() => {
  vi.mocked(getDescriptionSentences)
    .mockReset()
    .mockResolvedValue([...DEFAULT_DESCRIPTION_SENTENCES]);
  vi.mocked(saveDescriptionSentence).mockReset();
});

it('offers the three presets and updates individual points without changing the others', async () => {
  const user = userEvent.setup();
  renderWithProviders(<Harness initial={'Vorhandener Punkt\n'} />);
  const point = screen.getByRole('combobox', {
    name: 'Tätigkeiten 2',
  });
  await user.click(point);
  for (const sentence of DEFAULT_DESCRIPTION_SENTENCES)
    expect(
      await screen.findByRole('option', { name: sentence })
    ).toBeInTheDocument();
  await user.click(
    screen.getByRole('option', { name: DEFAULT_DESCRIPTION_SENTENCES[1] })
  );
  expect(point).toHaveValue(DEFAULT_DESCRIPTION_SENTENCES[1]);
  expect(screen.getByRole('combobox', { name: 'Tätigkeiten 1' })).toHaveValue(
    'Vorhandener Punkt'
  );
  expect(saveDescriptionSentence).not.toHaveBeenCalled();
});

it('accepts free text and saves it with + so another point can reuse it', async () => {
  vi.mocked(saveDescriptionSentence).mockResolvedValue([
    ...DEFAULT_DESCRIPTION_SENTENCES,
    'Prüfen von Anlagen',
  ]);
  const user = userEvent.setup();
  renderWithProviders(<Harness />);
  const first = screen.getByRole('combobox', {
    name: 'Tätigkeiten 1',
  });
  await user.type(first, 'Prüfen von Anlagen');
  expect(saveDescriptionSentence).not.toHaveBeenCalled();
  await user.click(
    screen.getByRole('button', { name: '+ für Hinzufügen' })
  );
  await waitFor(() =>
    expect(saveDescriptionSentence).toHaveBeenCalledWith(
      'Prüfen von Anlagen',
      expect.anything()
    )
  );
  await user.click(screen.getByRole('button', { name: 'Punkt hinzufügen' }));
  await user.click(screen.getByRole('combobox', { name: 'Tätigkeiten 2' }));
  await user.click(
    await screen.findByRole('option', { name: 'Prüfen von Anlagen' })
  );
  expect(screen.getByRole('combobox', { name: 'Tätigkeiten 2' })).toHaveValue(
    'Prüfen von Anlagen'
  );
});

it('supports keyboard selection and does not allow saving duplicates', async () => {
  const user = userEvent.setup();
  renderWithProviders(<Harness />);
  await user.click(screen.getByRole('combobox', { name: 'Tätigkeiten 1' }));
  await user.keyboard('{ArrowDown}{Enter}');
  expect(screen.getByRole('combobox', { name: 'Tätigkeiten 1' })).toHaveValue(
    DEFAULT_DESCRIPTION_SENTENCES[0]
  );
  expect(
    screen.getByRole('button', { name: '+ für Hinzufügen' })
  ).toBeDisabled();
});

it('preserves multiline paste and still renders plain bullets in read-only mode', () => {
  const view = renderWithProviders(<Harness />);
  fireEvent.paste(screen.getByRole('combobox', { name: 'Tätigkeiten 1' }), {
    clipboardData: { getData: () => 'Erster\nZweiter' },
  });
  expect(screen.getAllByRole('combobox')).toHaveLength(2);
  view.unmount();
  renderWithProviders(<Harness initial={'Erster\nZweiter'} readOnly />);
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
});

it('loads saved sentences again when the editor is reopened', async () => {
  vi.mocked(getDescriptionSentences).mockResolvedValue([
    ...DEFAULT_DESCRIPTION_SENTENCES,
    'Gespeicherter Satz',
  ]);
  const user = userEvent.setup();
  renderWithProviders(<Harness />);
  await user.click(screen.getByRole('combobox', { name: 'Tätigkeiten 1' }));
  expect(
    await screen.findByRole('option', { name: 'Gespeicherter Satz' })
  ).toBeInTheDocument();
});

it('keeps custom text and allows retrying when saving a sentence fails', async () => {
  const { toast } = await import('sonner');
  vi.mocked(saveDescriptionSentence).mockRejectedValueOnce(
    new Error('Offline')
  );
  const user = userEvent.setup();
  renderWithProviders(<Harness />);
  const point = screen.getByRole('combobox', { name: 'Tätigkeiten 1' });
  await user.type(point, 'Eigene Tätigkeit');
  const save = screen.getByRole('button', {
    name: '+ für Hinzufügen',
  });
  await user.click(save);
  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      'Beschreibungspunkt konnte nicht gespeichert werden'
    )
  );
  expect(point).toHaveValue('Eigene Tätigkeit');
  expect(save).toBeEnabled();
});
