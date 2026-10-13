import { AutomationOverviewCard } from '@/features/settings/automation/AutomationOverviewCard';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('AutomationOverviewCard', () => {
  it('shows the automation name and its short description', () => {
    render(
      <AutomationOverviewCard
        name="Microsoft 365 Konto anlegen"
        description="Erstellt nach der Vertragsbestätigung ein Microsoft-365-Konto."
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Microsoft 365 Konto anlegen' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Erstellt nach der Vertragsbestätigung ein Microsoft-365-Konto.'
      )
    ).toBeInTheDocument();
  });

  it('supports optional status and configuration content', () => {
    render(
      <AutomationOverviewCard
        name="Arbeitszeugnis"
        description="Erstellt ein Arbeitszeugnis."
        status={<span>Bereit</span>}
      >
        <button type="button">Konfigurieren</button>
      </AutomationOverviewCard>
    );

    expect(screen.getByText('Bereit')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Konfigurieren' })
    ).toBeInTheDocument();
  });
});
