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

  it('asks before showing the weekday hours and totals a decimal week', async () => {
    vi.mocked(apiJson.get).mockResolvedValue({
      success: true,
      data: {
        status: 'sent',
        intro: '',
        questions: [
          {
            key: 'weeklyHours',
            label: 'Wochenstunden',
            section: 'Beschäftigung',
            type: 'text',
          },
          {
            key: 'hoursDistribution',
            label: 'Soll die Arbeitszeit auf bestimmte Wochentage verteilt werden?',
            section: 'Ggf.Verteilung d. wöchentl. Arbeitszeit (Std.)',
            type: 'single',
            options: ['ja', 'nein'],
          },
          ...['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((label, index) => ({
            key: ['hoursMonday', 'hoursTuesday', 'hoursWednesday', 'hoursThursday', 'hoursFriday', 'hoursSaturday', 'hoursSunday'][index],
            label,
            section: 'Ggf.Verteilung d. wöchentl. Arbeitszeit (Std.)',
            type: 'text',
            layout: 'inline',
          })),
        ],
      },
    });
    const user = userEvent.setup();
    renderWithProviders(<QuestionnaireForm token="token" />);

    expect(
      await screen.findByText('Soll die Arbeitszeit auf bestimmte Wochentage verteilt werden?')
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Mo Stunden')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Ja' }));
    await user.type(screen.getByLabelText('Mo Stunden'), '7,5');
    await user.type(screen.getByLabelText('Di Stunden'), '8');
    expect(screen.getByText('Summe: 15,5 Std.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Wochenstunden'), '40');
    expect(screen.getByText(/weicht von/)).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Nein' }));
    expect(screen.queryByLabelText('Mo Stunden')).not.toBeInTheDocument();
  });

  it('shows table columns and adds a row only when more rows are allowed', async () => {
    const table = {
      kind: 'repeater' as const,
      key: 'rows.kinder-liste',
      section: 'Kinder, für die eine Elterneigenschaft nachgewiesen werden kann',
      allowMoreRows: true,
      columns: [
        { key: 'name', label: 'Name', type: 'text' as const },
        { key: 'vorname', label: 'Vorname', type: 'text' as const },
        { key: 'geburtsdatum', label: 'Geburtsdatum (TT.MM.JJJJ)', type: 'date' as const },
      ],
    };
    renderWithProviders(
      <QuestionnaireForm
        preview={{
          intro: '',
          items: [table],
        }}
      />
    );
    expect(
      screen.getByRole('heading', {
        name: 'Kinder, für die eine Elterneigenschaft nachgewiesen werden kann',
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Geburtsdatum (TT.MM.JJJJ)')).toBeInTheDocument();
    expect(screen.getByText('Keine Angaben')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Weitere Zeile' }));
    expect(
      screen.getByLabelText('Geburtsdatum (TT.MM.JJJJ) Zeile 1')
    ).toHaveAttribute('type', 'date');
    expect(screen.getAllByLabelText(/Zeile 1/)).toHaveLength(3);
    await userEvent.click(screen.getByRole('button', { name: 'Weitere Zeile' }));
    expect(screen.getByLabelText('Name Zeile 2')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Name Zeile 2'), 'Adler');
    await userEvent.click(screen.getByRole('button', { name: 'Zeile 1 entfernen' }));
    expect(screen.getByLabelText('Name Zeile 1')).toHaveValue('Adler');
    expect(screen.queryByLabelText('Name Zeile 2')).not.toBeInTheDocument();
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
  it('requires an unchecked declaration at the end even for a custom questionnaire', async () => {
    vi.mocked(apiJson.post).mockClear();
    vi.mocked(apiJson.get).mockResolvedValue({ success: true, data: { status: 'sent', items: [] } });
    vi.mocked(apiJson.post).mockResolvedValue({ success: true, data: { status: 'completed' } });
    const user = userEvent.setup();
    renderWithProviders(<QuestionnaireForm token="custom-token" />);
    const declaration = await screen.findByRole('checkbox', { name: /Erklärung der beschäftigten Person/ });
    const button = screen.getByRole('button', { name: 'Absenden' });
    expect(declaration).not.toBeChecked();
    expect(declaration).toBeRequired();
    expect(button).toBeDisabled();
    expect(screen.getByText(/Ich verpflichte mich, meinem Arbeitgeber alle Änderungen/)).toBeInTheDocument();
    await user.click(declaration);
    expect(button).toBeEnabled();
    await user.click(declaration);
    expect(button).toBeDisabled();
    await user.click(declaration);
    await user.click(button);
    expect(await screen.findByText('Danke, Ihre Angaben wurden übermittelt.')).toBeInTheDocument();
    expect(apiJson.post).toHaveBeenCalledWith('fragebogen/custom-token', expect.objectContaining({ declaration: 'ja' }));
  });

});
