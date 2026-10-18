import { apiJson } from '@/config/apiClient';
import { QuestionnaireTemplatePage } from '@/features/settings/questionnaire/QuestionnaireTemplatePage';
import type { TemplateItem } from '@/features/settings/questionnaire/questionnaireTemplate.types';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'test-unit/test-utils';
import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('@/config/apiClient', () => ({
  apiJson: { get: vi.fn(), put: vi.fn() },
}));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }));

let savedItems: TemplateItem[];
beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  savedItems = [
    {
      kind: 'field',
      key: 'custom.employment',
      label: 'Arbeitsverhältnis',
      section: 'Weitere Angaben',
      type: 'single',
      builtin: false,
      options: ['Befristet', 'Nicht Befristet'],
      required: true,
      defaultValue: 'Befristet',
      contractFieldKey: 'contract.employment',
    },
  ];
  vi.mocked(apiJson.get).mockImplementation(async () => ({
    success: true,
    data: {
      name: 'Personalfragebogen',
      intro: '',
      items: savedItems,
      catalog: [],
      contractFields: [
        { key: 'contract.employment', label: 'Arbeitsverhältnis' },
      ],
    },
  }));
  vi.mocked(apiJson.put).mockImplementation(async (_url, body) => {
    savedItems = (body as { items: TemplateItem[] }).items;
    return {
      success: true,
      data: { name: 'Personalfragebogen', items: savedItems },
    };
  });
});

it('edits a placed choice question, preserves its key/link and reloads the saved changes', async () => {
  const user = userEvent.setup();
  const view = renderWithProviders(<QuestionnaireTemplatePage />);
  await user.click(
    await screen.findByRole('button', {
      name: 'Frage bearbeiten: Arbeitsverhältnis',
    })
  );
  const editor = screen.getByRole('form', { name: 'Frage bearbeiten' });
  expect(within(editor).getByRole('textbox', { name: 'Frage' })).toHaveValue(
    'Arbeitsverhältnis'
  );
  await user.clear(within(editor).getByRole('textbox', { name: 'Frage' }));
  await user.type(
    within(editor).getByRole('textbox', { name: 'Frage' }),
    'Beschäftigungsart'
  );
  await user.clear(within(editor).getByRole('textbox', { name: 'Antworten' }));
  await user.type(
    within(editor).getByRole('textbox', { name: 'Antworten' }),
    'Zeitvertrag\nUnbefristet'
  );
  await user.click(within(editor).getByRole('switch', { name: 'Pflichtfeld' }));
  await user.click(within(editor).getByRole('button', { name: 'Übernehmen' }));
  expect(screen.getByRole('radio', { name: 'Zeitvertrag' })).not.toBeChecked();
  expect(
    screen.getByRole('radio', { name: 'Unbefristet' })
  ).toBeInTheDocument();
  expect(apiJson.put).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Speichern' }));
  await waitFor(() =>
    expect(savedItems[0]).toMatchObject({
      key: 'custom.employment',
      label: 'Beschäftigungsart',
      type: 'single',
      options: ['Zeitvertrag', 'Unbefristet'],
      required: false,
      defaultValue: '',
      contractFieldKey: 'contract.employment',
    })
  );
  view.unmount();
  renderWithProviders(<QuestionnaireTemplatePage />);
  await screen.findByRole('button', {
    name: 'Frage bearbeiten: Beschäftigungsart',
  });
  expect(
    screen.getByRole('radio', { name: 'Unbefristet' })
  ).toBeInTheDocument();
});

it('cancels edits without changing the placed question', async () => {
  const user = userEvent.setup();
  renderWithProviders(<QuestionnaireTemplatePage />);
  await user.click(
    await screen.findByRole('button', {
      name: 'Frage bearbeiten: Arbeitsverhältnis',
    })
  );
  await user.clear(screen.getByRole('textbox', { name: 'Frage' }));
  await user.type(screen.getByRole('textbox', { name: 'Frage' }), 'Verwerfen');
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Fragetyp' }),
    'text'
  );
  await user.click(screen.getByRole('button', { name: 'Abbrechen' }));
  expect(
    screen.getByRole('button', { name: 'Frage bearbeiten: Arbeitsverhältnis' })
  ).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'Befristet' })).toBeChecked();
  await user.click(screen.getByRole('button', { name: 'Speichern' }));
  expect(savedItems[0]).toMatchObject({
    label: 'Arbeitsverhältnis',
    type: 'single',
    defaultValue: 'Befristet',
  });
});

it('blocks invalid choices and allows changing the type of a placed custom field', async () => {
  const user = userEvent.setup();
  renderWithProviders(<QuestionnaireTemplatePage />);
  await user.click(
    await screen.findByRole('button', {
      name: 'Frage bearbeiten: Arbeitsverhältnis',
    })
  );
  await user.clear(screen.getByRole('textbox', { name: 'Antworten' }));
  await user.type(
    screen.getByRole('textbox', { name: 'Antworten' }),
    'Nur eine'
  );
  await user.click(screen.getByRole('button', { name: 'Übernehmen' }));
  expect(screen.getByRole('alert')).toHaveTextContent('zwei bis acht');
  expect(apiJson.put).not.toHaveBeenCalled();
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Fragetyp' }),
    'text'
  );
  await user.click(screen.getByRole('button', { name: 'Übernehmen' }));
  await user.click(screen.getByRole('button', { name: 'Speichern' }));
  expect(savedItems[0]).toMatchObject({
    key: 'custom.employment',
    type: 'text',
    max: 255,
    contractFieldKey: 'contract.employment',
  });
  expect(savedItems[0]).not.toHaveProperty('options', expect.any(Array));
  expect(savedItems[0]).not.toHaveProperty('defaultValue', 'Befristet');
});

it('edits builtin labels without offering unsupported type or choice changes', async () => {
  savedItems = [
    {
      kind: 'field',
      key: 'firstName',
      label: 'Vorname',
      section: 'Person',
      type: 'text',
      builtin: true,
      required: true,
      defaultValue: 'Ada',
    },
  ];
  const user = userEvent.setup();
  renderWithProviders(<QuestionnaireTemplatePage />);
  await user.click(
    await screen.findByRole('button', { name: 'Frage bearbeiten: Vorname' })
  );
  expect(
    screen.queryByRole('combobox', { name: 'Fragetyp' })
  ).not.toBeInTheDocument();
  await user.clear(screen.getByRole('textbox', { name: 'Frage' }));
  await user.type(screen.getByRole('textbox', { name: 'Frage' }), 'Rufname');
  await user.click(screen.getByRole('button', { name: 'Übernehmen' }));
  await user.click(screen.getByRole('button', { name: 'Speichern' }));
  expect(savedItems[0]).toMatchObject({
    key: 'firstName',
    label: 'Rufname',
    type: 'text',
    required: true,
    builtin: true,
    defaultValue: 'Ada',
  });
});
