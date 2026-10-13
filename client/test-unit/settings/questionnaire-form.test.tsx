import { QuestionnaireForm } from '@/features/questionnaire/QuestionnaireForm';
import { apiJson } from '@/config/apiClient';
import { screen } from '@testing-library/react';
import { renderWithProviders } from 'test-unit/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/config/apiClient', () => ({
  apiJson: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('QuestionnaireForm', () => {
  beforeEach(() => {
    vi.mocked(apiJson.get).mockResolvedValue({
      success: true,
      data: {
        status: 'sent',
        intro: 'DATEV-Lohnabrechnungsprogramm',
        questions: [
          {
            key: 'lastName',
            label: 'Familienname',
            section: 'Persönliche Angaben',
            type: 'text',
            required: true,
          },
          {
            key: 'sex',
            label: 'Geschlecht',
            section: 'Persönliche Angaben',
            type: 'single',
            required: true,
            options: ['männlich', 'weiblich', 'unbestimmt', 'divers'],
          },
          {
            key: 'employer',
            label: 'Beschäftigungsbetrieb',
            section: 'Beschäftigung',
            type: 'text',
            defaultValue: 'BSB Haustechnik GmbH',
          },
          {
            key: 'declaration',
            label: 'Ich versichere, dass die vorstehenden Angaben der Wahrheit entsprechen.',
            section: 'Erklärung',
            type: 'check',
            required: true,
          },
        ],
      },
    });
  });

  it('shows the Personalbogen sections, choices, and printed defaults', async () => {
    renderWithProviders(<QuestionnaireForm token="token" />);

    expect(await screen.findByText('DATEV-Lohnabrechnungsprogramm')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Persönliche Angaben' })).toBeInTheDocument();
    expect(screen.getByLabelText('Familienname *')).toBeInTheDocument();
    expect(screen.getByText('männlich')).toBeInTheDocument();
    expect(screen.getByText('divers')).toBeInTheDocument();
    expect(screen.getByLabelText('Beschäftigungsbetrieb')).toHaveValue(
      'BSB Haustechnik GmbH'
    );
    expect(
      screen.getByRole('checkbox', {
        name: /Ich versichere, dass die vorstehenden Angaben der Wahrheit entsprechen/,
      })
    ).toBeInTheDocument();
  });
});
