import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test-utils';
import { WorkerTypeFilter } from '@/features/worker-lifecycle/components/WorkerTypeFilter';
import { useWorkerFilter } from '@/features/worker-lifecycle/hooks/useWorkerFilter';
import type { WorkerRecord } from '@/features/worker-lifecycle/types/index.types';

vi.mock(
  '@/features/employee-overview/query-options/queries/employee.queries',
  () => ({
    employeeQueries: {
      getEmployees: () => ({
        queryKey: ['filter-test-employees'],
        queryFn: async () => [],
      }),
    },
  })
);
const workers = [
  {
    id: 'joining',
    createdAt: '2026-01-01',
    engagements: [{ type: 'onboarding' }],
  },
  {
    id: 'leaving',
    createdAt: '2026-01-02',
    engagements: [{ type: 'offboarding' }, { type: 'transfer' }],
  },
  { id: 'team', createdAt: '2026-01-03', engagements: [{ type: 'transfer' }] },
] as WorkerRecord[];
const storageKey = (user = 'user-a', org = 'org-a') =>
  `worker-type-filter:v1:${org}:${user}`;
function Harness({
  userId = 'user-a',
  orgId = 'org-a',
}: {
  userId?: string;
  orgId?: string;
}) {
  const filter = useWorkerFilter(workers, userId, orgId);
  return (
    <>
      <WorkerTypeFilter
        selectedTypes={filter.selectedTypes}
        onToggle={filter.toggleType}
      />
      <ul aria-label="Ergebnis">
        {filter.filteredWorkers.map((w) => (
          <li key={w.id}>{w.id}</li>
        ))}
      </ul>
      <output aria-label="Teammodus">{String(filter.isTeamMode)}</output>
    </>
  );
}
const resultNames = () =>
  within(screen.getByLabelText('Ergebnis'))
    .queryAllByRole('listitem', { hidden: true })
    .map((item) => item.textContent);
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

it('shows only type checkboxes and keeps the menu open for multiple selections', async () => {
  const user = userEvent.setup();
  renderWithProviders(<Harness />);
  await user.click(screen.getByRole('button', { name: /Typ filtern/ }));
  expect(screen.getAllByRole('menuitemcheckbox')).toHaveLength(3);
  for (const name of ['Onboarding', 'Offboarding', 'Team'])
    expect(screen.getByRole('menuitemcheckbox', { name })).toBeChecked();
  for (const name of ['Alle', 'Hinzugefügt', 'Status', 'Verantwortlich'])
    expect(screen.queryByText(name)).not.toBeInTheDocument();
  await user.click(screen.getByRole('menuitemcheckbox', { name: 'Team' }));
  expect(resultNames()).toEqual(['leaving', 'joining']);
  expect(
    screen.getByRole('menuitemcheckbox', { name: 'Team' })
  ).not.toBeChecked();
  await user.click(
    screen.getByRole('menuitemcheckbox', { name: 'Offboarding' })
  );
  expect(resultNames()).toEqual(['joining']);
  expect(JSON.parse(localStorage.getItem(storageKey())!)).toEqual([
    'onboarding',
  ]);
});

it('restores the user selection after remounting, including selecting no types', async () => {
  const user = userEvent.setup();
  localStorage.setItem(
    storageKey(),
    JSON.stringify(['onboarding', 'offboarding'])
  );
  const view = renderWithProviders(<Harness />);
  expect(resultNames()).toEqual(['leaving', 'joining']);
  await user.click(screen.getByRole('button', { name: /Typ filtern/ }));
  await user.click(
    screen.getByRole('menuitemcheckbox', { name: 'Onboarding' })
  );
  await user.click(
    screen.getByRole('menuitemcheckbox', { name: 'Offboarding' })
  );
  expect(resultNames()).toEqual([]);
  view.unmount();
  renderWithProviders(<Harness />);
  expect(resultNames()).toEqual([]);
  await user.click(screen.getByRole('button', { name: /Typ filtern/ }));
  expect(
    screen
      .getAllByRole('menuitemcheckbox')
      .every((item) => item.getAttribute('aria-checked') === 'false')
  ).toBe(true);
});

it('isolates preferences when switching users or organizations', async () => {
  localStorage.setItem(storageKey(), JSON.stringify(['transfer']));
  const view = renderWithProviders(<Harness />);
  expect(resultNames()).toEqual(['team']);
  expect(screen.getByLabelText('Teammodus')).toHaveTextContent('true');
  view.rerender(<Harness userId="user-b" />);
  expect(resultNames()).toHaveLength(3);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /Typ filtern/ }));
  await user.click(screen.getByRole('menuitemcheckbox', { name: 'Team' }));
  expect(JSON.parse(localStorage.getItem(storageKey('user-b'))!)).toEqual([
    'onboarding',
    'offboarding',
  ]);
  expect(JSON.parse(localStorage.getItem(storageKey())!)).toEqual(['transfer']);
  view.rerender(<Harness />);
  expect(resultNames()).toEqual(['team']);
  view.rerender(<Harness orgId="org-b" />);
  expect(resultNames()).toHaveLength(3);
});

it.each(['invalid json', 'null', '["obsolete-type"]', '{}'])(
  'uses the default selection when saved preferences are invalid: %s',
  (saved) => {
    localStorage.setItem(storageKey(), saved);
    renderWithProviders(<Harness />);
    expect(resultNames()).toHaveLength(3);
  }
);

it('still filters when saving preferences is blocked by the browser', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Storage blocked');
  });
  const user = userEvent.setup();
  renderWithProviders(<Harness />);
  await user.click(screen.getByRole('button', { name: /Typ filtern/ }));
  await user.click(screen.getByRole('menuitemcheckbox', { name: 'Team' }));
  expect(resultNames()).toEqual(['leaving', 'joining']);
});
