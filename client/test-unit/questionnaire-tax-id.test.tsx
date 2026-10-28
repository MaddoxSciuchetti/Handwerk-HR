import { apiJson } from '@/config/apiClient';
import { QuestionnaireForm } from '@/features/questionnaire/QuestionnaireForm';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './test-utils';
import { expect, it, vi } from 'vitest';

vi.mock('@/config/apiClient', () => ({ apiJson: { get: vi.fn(), post: vi.fn() } }));

it('blocks an invalid Steuer-ID and accepts a pasted number with spaces', async () => {
  vi.mocked(apiJson.get).mockResolvedValue({
    success: true,
    data: {
      status: 'sent', intro: '',
      questions: [{ key: 'taxId', label: 'Identifikationsnr.', section: 'Steuer', type: 'text', required: true, max: 32 }],
    },
  });
  const user = userEvent.setup();
  renderWithProviders(<QuestionnaireForm token="token" />);
  const input = await screen.findByLabelText('Identifikationsnr. *');
  await user.click(screen.getByRole('checkbox'));
  await user.type(input, '86095742718');
  expect(screen.getByRole('alert')).toHaveTextContent('gültige 11-stellige Steuer-ID');
  expect(screen.getByRole('button', { name: /absenden/i })).toBeDisabled();
  await user.clear(input);
  await user.click(input);
  await user.paste('86 095 742 719');
  expect(input).toHaveValue('86095742719');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /absenden/i })).toBeEnabled();
});
