import { QuestionnaireTemplatePage } from '@/features/settings/questionnaire/QuestionnaireTemplatePage';
import { apiJson } from '@/config/apiClient';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'test-unit/test-utils';
import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('@/config/apiClient', () => ({
  apiJson: { get: vi.fn(), put: vi.fn() },
}));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }));

const items = [
  {
    kind: 'field',
    key: 'firstName',
    label: 'Vorname',
    section: 'Person',
    type: 'text',
  },
];
beforeEach(() => {
  sessionStorage.clear();
  vi.mocked(apiJson.get).mockResolvedValue({
    success: true,
    data: {
      name: 'Personalfragebogen',
      intro: 'Introduction',
      items,
      catalog: items,
      contractFields: [],
    },
  });
  vi.mocked(apiJson.put).mockResolvedValue({
    success: true,
    data: { name: 'Personalbogen Montage', items },
  });
});

it('saves the user-selected questionnaire name together with its questions', async () => {
  renderWithProviders(<QuestionnaireTemplatePage />);
  const name = await screen.findByRole('textbox', {
    name: 'Name des Fragebogens',
  });
  await userEvent.clear(name);
  await userEvent.type(name, 'Personalbogen Montage');
  await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));
  expect(apiJson.put).toHaveBeenCalledWith('/automation/questionnaire', {
    name: 'Personalbogen Montage',
    items,
  });
});

it('keeps the edited name when opening the preview and disables saving an empty name', async () => {
  renderWithProviders(<QuestionnaireTemplatePage />);
  const name = await screen.findByRole('textbox', {
    name: 'Name des Fragebogens',
  });
  await userEvent.clear(name);
  expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled();
  await userEvent.type(name, 'Montage');
  await userEvent.click(screen.getByRole('button', { name: 'Vorschau' }));
  expect(JSON.parse(sessionStorage.getItem('fragebogen-preview')!).name).toBe(
    'Montage'
  );
});
