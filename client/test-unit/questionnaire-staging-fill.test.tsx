import { apiJson } from '@/config/apiClient';
import { QuestionnaireForm } from '@/features/questionnaire/QuestionnaireForm';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './test-utils';
import { expect, it, vi } from 'vitest';

vi.mock('@/config/apiClient', () => ({
  apiJson: { get: vi.fn(), post: vi.fn() },
}));

it('fills demo answers from the staging button and leaves the control hidden otherwise', async () => {
  vi.mocked(apiJson.get).mockResolvedValue({
    success: true,
    data: {
      status: 'sent',
      staging: true,
      questions: [
        {
          key: 'firstName',
          label: 'Vorname',
          section: 'Person',
          type: 'text',
          required: true,
        },
        {
          key: 'lastName',
          label: 'Nachname',
          section: 'Person',
          type: 'text',
          required: true,
        },
      ],
    },
  });
  const user = userEvent.setup();
  const { unmount } = renderWithProviders(
    <QuestionnaireForm token="token" />
  );
  await screen.findByLabelText('Vorname *');
  await user.click(
    screen.getByRole('button', { name: 'Fill out with staging' })
  );
  expect(screen.getByLabelText('Vorname *')).toHaveValue('Lukas');
  expect(screen.getByLabelText('Nachname *')).toHaveValue('Adler');
  expect(screen.getByRole('checkbox')).toBeChecked();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /absenden/i })).toBeEnabled()
  );
  unmount();

  vi.mocked(apiJson.get).mockResolvedValue({
    success: true,
    data: {
      status: 'sent',
      staging: false,
      questions: [
        {
          key: 'firstName',
          label: 'Vorname',
          section: 'Person',
          type: 'text',
          required: true,
        },
      ],
    },
  });
  renderWithProviders(<QuestionnaireForm token="token-2" />);
  await screen.findByLabelText('Vorname *');
  expect(
    screen.queryByRole('button', { name: 'Fill out with staging' })
  ).not.toBeInTheDocument();
});
