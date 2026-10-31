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
  await expect(apiJson.put).toHaveBeenCalled();
  const [, body] = vi.mocked(apiJson.put).mock.calls.at(-1)!;
  expect(body).toEqual(
    expect.objectContaining({
      name: 'Personalbogen Montage',
      items: expect.arrayContaining(items),
    })
  );
  expect(
    (body as { items: { kind?: string }[] }).items.filter(
      (item) => item.kind !== 'section'
    )
  ).toEqual(items);
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

it('keeps the questionnaire layout and disables actions while questions load', async () => {
  let complete!: (value: unknown) => void;
  vi.mocked(apiJson.get).mockReturnValueOnce(
    new Promise((resolve) => {
      complete = resolve;
    })
  );
  renderWithProviders(<QuestionnaireTemplatePage />);
  expect(
    screen.getByRole('heading', { name: 'Fragebogen' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('status', { name: 'Fragebogen wird geladen' })
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Vorschau' })).toBeDisabled();
  complete({
    success: true,
    data: {
      name: 'Personalfragebogen',
      intro: '',
      items,
      catalog: items,
      contractFields: [],
    },
  });
  await screen.findByRole('textbox', { name: 'Name des Fragebogens' });
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Speichern' })).toBeEnabled();
});
