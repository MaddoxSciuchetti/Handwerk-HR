import { QuestionnaireTemplatePage } from '@/features/settings/questionnaire/QuestionnaireTemplatePage';
import { apiJson } from '@/config/apiClient';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'test-unit/test-utils';
import { beforeEach, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import type { TemplateItem } from '@/features/settings/questionnaire/questionnaireTemplate.types';

vi.mock('@/config/apiClient', () => ({
  apiJson: { get: vi.fn(), put: vi.fn() },
}));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
const items: TemplateItem[] = [
  {
    kind: 'field',
    key: 'custom.name',
    label: 'Vorname',
    section: 'Person',
    type: 'text',
    builtin: false,
  },
  {
    kind: 'repeater',
    key: 'rows.children',
    section: 'Kinder',
    columns: [{ key: 'name', label: 'Name', type: 'text' }],
  },
];
const template = {
  name: 'Personalfragebogen',
  intro: '',
  items,
  catalog: items,
  contractFields: [{ key: 'firstName', label: 'Vorname' }],
};
beforeEach(() => {
  vi.mocked(toast.error).mockClear();
  sessionStorage.clear();
  vi.mocked(apiJson.put).mockReset();
  vi.mocked(apiJson.get)
    .mockReset()
    .mockResolvedValue({ success: true, data: template });
  vi.mocked(apiJson.put).mockImplementation(async (_url, body) => ({
    success: true,
    data: { ...template, ...(body as object) },
  }));
});
async function expectSaved(expected: object) {
  await waitFor(() =>
    expect(apiJson.put).toHaveBeenLastCalledWith(
      '/automation/questionnaire',
      expect.objectContaining(expected)
    )
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Speichern' })).toHaveAttribute(
      'aria-busy',
      'false'
    )
  );
}
it('autosaves question text while typing, answers, switches, and the name', async () => {
  const user = userEvent.setup();
  renderWithProviders(<QuestionnaireTemplatePage />);
  await screen.findByRole('textbox', { name: 'Frage' });
  expect(apiJson.put).not.toHaveBeenCalled();
  await user.click(screen.getByRole('textbox', { name: 'Frage' }));
  await user.type(screen.getByRole('textbox', { name: 'Frage' }), ' neu');
  await expectSaved({
    items: [expect.objectContaining({ label: 'Vorname neu' }), items[1]],
  });
  await user.type(screen.getByRole('textbox', { name: 'Antwort' }), 'Ada');
  await user.click(screen.getByRole('switch', { name: 'Pflichtfeld' }));
  await user.click(
    screen.getAllByRole('switch', { name: 'Nur vom Betrieb' })[0]
  );
  expect(
    screen.queryByRole('combobox', { name: 'Vertragsfeld' })
  ).not.toBeInTheDocument();
  await user.clear(screen.getByLabelText('Name des Fragebogens'));
  await user.type(screen.getByLabelText('Name des Fragebogens'), 'Montage');
  await expectSaved({
    name: 'Montage',
    items: [
      expect.objectContaining({
        label: 'Vorname neu',
        defaultValue: 'Ada',
        required: false,
        officeOnly: true,
      }),
      items[1],
    ],
  });
});
it('autosaves dragging, table settings, adding fields, and removing questions', async () => {
  const user = userEvent.setup();
  const view = renderWithProviders(<QuestionnaireTemplatePage />);
  await screen.findByRole('textbox', { name: 'Frage' });
  fireEvent.drop(view.container.querySelector('article')!, {
    dataTransfer: {
      getData: () => JSON.stringify({ source: 'stack', id: 'rows.children' }),
    },
  });
  await expectSaved({ items: [items[1], items[0]] });
  await user.click(
    screen.getByRole('button', { name: 'Weitere Zeilen erlauben' })
  );
  await user.click(
    screen.getAllByRole('switch', { name: 'Nur vom Betrieb' })[0]
  );
  await expectSaved({
    items: [
      expect.objectContaining({
        allowMoreRows: true,
        columns: [expect.objectContaining({ officeOnly: true })],
      }),
      items[0],
    ],
  });
  await user.click(
    screen.getAllByRole('button', { name: 'Frage hier einfügen' }).at(-1)!
  );
  await user.type(screen.getByPlaceholderText('Frage'), 'Zusatz');
  await user.click(screen.getByRole('button', { name: 'Hinzufügen' }));
  await expectSaved({
    items: [
      expect.anything(),
      items[0],
      expect.objectContaining({ label: 'Zusatz' }),
    ],
  });
  await user.click(screen.getAllByRole('button', { name: 'Entfernen' })[2]);
  await expectSaved({ items: [expect.anything(), items[0]] });
});
it('serializes saves and preserves reverts made while a request is pending', async () => {
  let resolve!: (value: unknown) => void;
  vi.mocked(apiJson.put).mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      })
  );
  const user = userEvent.setup();
  renderWithProviders(<QuestionnaireTemplatePage />);
  const name = await screen.findByLabelText('Name des Fragebogens');
  await user.type(name, ' neu');
  await waitFor(() => expect(apiJson.put).toHaveBeenCalledTimes(1));
  expect(
    screen.getByRole('status', { name: 'Wird gespeichert' })
  ).toBeInTheDocument();
  expect(
    screen.queryByText('Alle Änderungen gespeichert')
  ).not.toBeInTheDocument();
  await user.clear(name);
  await user.type(name, 'Personalfragebogen');
  expect(apiJson.put).toHaveBeenCalledTimes(1);
  await act(async () =>
    resolve({
      success: true,
      data: { ...template, name: 'Personalfragebogen neu' },
    })
  );
  await expectSaved({ name: 'Personalfragebogen' });
  expect(apiJson.put).toHaveBeenCalledTimes(2);
  expect(name).toHaveValue('Personalfragebogen');
});
it('shows failed saves, keeps edits, and allows retrying', async () => {
  vi.mocked(apiJson.put).mockRejectedValueOnce(new Error('Offline'));
  const user = userEvent.setup();
  renderWithProviders(<QuestionnaireTemplatePage />);
  const name = await screen.findByLabelText('Name des Fragebogens');
  await user.type(name, ' neu');
  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      'Fragebogen konnte nicht gespeichert werden'
    )
  );
  expect(name).toHaveValue('Personalfragebogen neu');
  await user.click(screen.getByRole('button', { name: 'Speichern' }));
  await expectSaved({ name: 'Personalfragebogen neu' });
});
it('flushes pending edits when leaving the editor before the debounce', async () => {
  const view = renderWithProviders(<QuestionnaireTemplatePage />);
  const name = await screen.findByLabelText('Name des Fragebogens');
  fireEvent.change(name, { target: { value: 'Montage' } });
  expect(apiJson.put).not.toHaveBeenCalled();
  view.unmount();
  await waitFor(() =>
    expect(apiJson.put).toHaveBeenCalledWith('/automation/questionnaire', {
      name: 'Montage',
      items,
    })
  );
});

it('autosaves checkbox options and weekly hour edits', async () => {
  const { weeklyHoursFields } =
    await import('@/features/settings/questionnaire/weeklyHoursFields');
  const custom: TemplateItem = {
    kind: 'field',
    key: 'custom.shift',
    section: 'Person',
    label: 'Schicht',
    type: 'check',
    builtin: false,
    options: ['Früh', 'Spät'],
  };
  vi.mocked(apiJson.get).mockResolvedValueOnce({
    success: true,
    data: { ...template, items: [custom, ...weeklyHoursFields()] },
  });
  const user = userEvent.setup();
  renderWithProviders(<QuestionnaireTemplatePage />);
  const options = await screen.findByRole('textbox', {
    name: 'Text neben den Kästchen',
  });
  await user.type(options, '\nNacht');
  await user.click(screen.getByRole('button', { name: 'Bearbeiten' }));
  await user.click(
    screen.getAllByRole('switch', { name: 'Nur vom Betrieb' })[1]
  );
  await expectSaved({
    items: [
      expect.objectContaining({ options: ['Früh', 'Spät', 'Nacht'] }),
      ...weeklyHoursFields().map((field, index) =>
        index === 0
          ? field
          : expect.objectContaining({ key: field.key, officeOnly: true })
      ),
    ],
  });
});

it('autosaves cancellation of a question title back to its original text', async () => {
  const user = userEvent.setup();
  renderWithProviders(<QuestionnaireTemplatePage />);
  await user.click(await screen.findByRole('textbox', { name: 'Frage' }));
  const title = screen.getByRole('textbox', { name: 'Frage' });
  await user.type(title, ' neu');
  await expectSaved({
    items: [expect.objectContaining({ label: 'Vorname neu' }), items[1]],
  });
  await user.type(title, '{Escape}');
  await expectSaved({ items });
  expect(screen.getByRole('textbox', { name: 'Frage' })).toHaveValue('Vorname');
});
