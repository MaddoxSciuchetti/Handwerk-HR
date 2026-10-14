import { QuestionnaireForm } from '@/features/questionnaire/QuestionnaireForm';
import { apiJson } from '@/config/apiClient';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
          {
            key: 'shift',
            label: 'Schicht',
            section: 'Weitere Angaben',
            type: 'check',
            required: true,
            options: ['Früh', 'Spät'],
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
    expect(screen.getByRole('checkbox', { name: 'Früh' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Spät' })).toBeInTheDocument();
  });

  it('shows a drafted question the way the candidate would see it', () => {
    vi.mocked(apiJson.get).mockClear();
    renderWithProviders(
      <QuestionnaireForm
        preview={{
          intro: 'DATEV-Lohnabrechnungsprogramm',
          items: [
            {
              kind: 'field',
              key: 'shift',
              label: 'Schicht',
              section: 'Weitere Angaben',
              type: 'check',
              required: true,
              options: ['Früh', 'Spät'],
            },
          ],
        }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Personalfragebogen' })).toBeInTheDocument();
    expect(screen.getByText('DATEV-Lohnabrechnungsprogramm')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Früh' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Absenden' })).toBeInTheDocument();
    expect(apiJson.get).not.toHaveBeenCalled();
  });

  it('clears a chosen radio button when it is clicked again', async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuestionnaireForm token="token" />);

    const male = await screen.findByRole('radio', { name: 'männlich' });
    await user.click(male);
    expect(male).toBeChecked();
    await user.click(male);
    expect(male).not.toBeChecked();
  });
});
