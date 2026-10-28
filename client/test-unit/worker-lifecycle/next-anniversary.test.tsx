import NextAnniversary from '@/features/worker-lifecycle/components/NextAnniversary';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('next anniversary notice', () => {
  it('shows the next person, the date, and the milestone', () => {
    render(
      <NextAnniversary
        isLoading={false}
        people={[
          {
            id: 'franz',
            firstName: 'Franz',
            lastName: 'Raudszus',
            entryDate: '2022-06-13',
          },
          {
            id: 'nico',
            firstName: 'Nico',
            lastName: 'Lange',
            entryDate: '1990-01-01',
          },
        ]}
      />
    );

    expect(screen.getByRole('region', { name: 'Nächste Jubiläen' })).toBeVisible();
    expect(screen.getByText('Franz Raudszus')).toBeVisible();
    expect(screen.getByText('13.06.2027')).toBeVisible();
    expect(screen.getByText(/5 Jahre/)).toBeVisible();
    expect(screen.queryByText('Nico Lange')).not.toBeInTheDocument();
  });

  it('shows up to the next three upcoming anniversaries', () => {
    render(
      <NextAnniversary
        isLoading={false}
        people={[
          {
            id: 'nico',
            firstName: 'Nico',
            lastName: 'Lange',
            entryDate: '2022-04-15',
          },
          {
            id: 'franz',
            firstName: 'Franz',
            lastName: 'Raudszus',
            entryDate: '2022-06-13',
          },
          {
            id: 'anna',
            firstName: 'Anna',
            lastName: 'Berg',
            entryDate: '2022-09-01',
          },
          {
            id: 'leo',
            firstName: 'Leo',
            lastName: 'Wolf',
            entryDate: '2022-12-01',
          },
        ]}
      />
    );

    expect(
      screen.getByRole('region', { name: 'Nächste Jubiläen' })
    ).toBeVisible();
    expect(screen.getByText('Nico Lange')).toBeVisible();
    expect(screen.getByText('Franz Raudszus')).toBeVisible();
    expect(screen.getByText('Anna Berg')).toBeVisible();
    expect(screen.queryByText('Leo Wolf')).not.toBeInTheDocument();
  });
});
