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
            entryDate: '2025-04-15',
          },
        ]}
      />
    );

    expect(screen.getByRole('region', { name: 'Nächstes Jubiläum' })).toBeVisible();
    expect(screen.getByText('Franz Raudszus')).toBeVisible();
    expect(screen.getByText('13.06.2027')).toBeVisible();
    expect(screen.getByText(/5 Jahre/)).toBeVisible();
    expect(screen.queryByText('Nico Lange')).not.toBeInTheDocument();
  });
});
