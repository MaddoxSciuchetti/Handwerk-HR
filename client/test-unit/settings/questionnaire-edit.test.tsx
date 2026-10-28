import { apiJson } from '@/config/apiClient';
import { QuestionnaireTemplatePage } from '@/features/settings/questionnaire/QuestionnaireTemplatePage';
import type { TemplateItem } from '@/features/settings/questionnaire/questionnaireTemplate.types';
import { screen, waitFor } from '@testing-library/react';
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

it('edits the master inline without a separate edit button and reloads saved changes', async () => {
  const user = userEvent.setup();
  const view = renderWithProviders(<QuestionnaireTemplatePage />);
  const title = await screen.findByRole('textbox', { name: 'Frage' });
  expect(
    screen.queryByRole('button', { name: /bearbeiten/i })
  ).not.toBeInTheDocument();
  await user.clear(title);
  await user.type(title, 'Beschäftigungsart');
  await user.tab();
  await user.click(screen.getByRole('button', { name: 'Speichern' }));
  await waitFor(() =>
    expect(savedItems[0]).toMatchObject({
      key: 'custom.employment',
      label: 'Beschäftigungsart',
      contractFieldKey: 'contract.employment',
      defaultValue: 'Befristet',
    })
  );
  view.unmount();
  renderWithProviders(<QuestionnaireTemplatePage />);
  expect(await screen.findByRole('textbox', { name: 'Frage' })).toHaveValue(
    'Beschäftigungsart'
  );
  expect(screen.getByRole('radio', { name: 'Befristet' })).toBeChecked();
});

it('saves the BSB-only toggle and keeps the field editable for the office', async () => {
  const user = userEvent.setup();
  const view = renderWithProviders(<QuestionnaireTemplatePage />);
  const toggle = await screen.findByRole('switch', {
    name: 'Nur vom Betrieb',
  });
  expect(toggle).toHaveAttribute('aria-checked', 'false');
  await user.click(toggle);
  expect(screen.getByRole('radio', { name: 'Befristet' })).toBeEnabled();
  await user.click(screen.getByRole('button', { name: 'Speichern' }));
  await waitFor(() =>
    expect(savedItems[0]).toMatchObject({ officeOnly: true, required: true })
  );
  view.unmount();
  renderWithProviders(<QuestionnaireTemplatePage />);
  expect(
    await screen.findByRole('switch', { name: 'Nur vom Betrieb' })
  ).toHaveAttribute('aria-checked', 'true');
  await user.click(screen.getByRole('switch', { name: 'Nur vom Betrieb' }));
  await user.click(screen.getByRole('button', { name: 'Speichern' }));
  await waitFor(() =>
    expect(savedItems[0]).toMatchObject({
      officeOnly: undefined,
      required: true,
    })
  );
});

it('clears a selected radio answer when clicked again and saves the cleared default', async () => {
  const user = userEvent.setup();
  renderWithProviders(<QuestionnaireTemplatePage />);
  const selected = await screen.findByRole('radio', { name: 'Befristet' });
  const other = screen.getByRole('radio', { name: 'Nicht Befristet' });
  expect(selected).toBeChecked();
  await user.click(selected);
  expect(selected).not.toBeChecked();
  expect(other).not.toBeChecked();
  await user.click(other);
  expect(other).toBeChecked();
  await user.click(screen.getByText('Nicht Befristet', { selector: 'label' }));
  expect(other).not.toBeChecked();
  await user.click(selected);
  expect(selected).toBeChecked();
  await user.click(selected);
  expect(selected).not.toBeChecked();
  await user.click(screen.getByRole('button', { name: 'Speichern' }));
  await waitFor(() => expect(savedItems[0]).toHaveProperty('defaultValue', ''));
});
