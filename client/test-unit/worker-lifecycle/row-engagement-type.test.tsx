import { Table, TableBody } from '@/components/ui/table';
import ProjectItem from '@/features/worker-lifecycle/components/ProjectItem';
import type { WorkerRecord } from '@/features/worker-lifecycle/types/index.types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/features/worker-lifecycle/components/WorkerEngagementInfoButton',
  () => ({
    default: () => null,
  })
);
vi.mock(
  '@/features/worker-lifecycle/components/ui/EngagementProgressPicker',
  () => ({
    EngagementProgressPicker: () => null,
  })
);

const worker = {
  id: 'worker-1',
  firstName: 'Maddox',
  lastName: 'Example',
  engagements: [
    {
      id: 'engagement-1',
      type: 'transfer',
      responsibleUser: { id: 'user-1', firstName: 'Local', lastName: '' },
      issues: [],
    },
  ],
} as unknown as WorkerRecord;

function setup(isChangingType = false, hideTaskColumns = false) {
  const navigate = vi.fn();
  const changeType = vi.fn();
  const changeResponsible = vi.fn();
  render(
    <Table>
      <TableBody>
        <ProjectItem
          worker={worker}
          hideTaskColumns={hideTaskColumns}
          gotopage={navigate}
          isSelected={false}
          setLargeEditMode={vi.fn()}
          setEditModeData={vi.fn()}
          onTypeChange={changeType}
          isChangingType={isChangingType}
          responsibleUsers={[
            { id: 'user-1', firstName: 'Local', lastName: '' },
            { id: 'user-2', firstName: 'Anna', lastName: 'Example' },
          ]}
          onResponsibleChange={changeResponsible}
          isChangingResponsible={false}
        />
      </TableBody>
    </Table>
  );
  return { user: userEvent.setup(), navigate, changeType, changeResponsible };
}

describe('worker row type picker', () => {
  it('changes the responsible user without opening the worker', async () => {
    const { user, navigate, changeResponsible } = setup();
    await user.click(
      screen.getByRole('button', {
        name: 'Verantwortlichen für Maddox Example ändern',
      })
    );
    expect(
      screen.getByRole('menuitemradio', { name: 'Local' })
    ).toHaveAttribute('aria-checked', 'true');
    await user.click(
      screen.getByRole('menuitemradio', { name: 'Anna Example' })
    );
    expect(changeResponsible).toHaveBeenCalledExactlyOnceWith('user-2');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not save the current responsible user again', async () => {
    const { user, changeResponsible } = setup();
    await user.click(
      screen.getByRole('button', {
        name: 'Verantwortlichen für Maddox Example ändern',
      })
    );
    await user.click(screen.getByRole('menuitemradio', { name: 'Local' }));
    expect(changeResponsible).not.toHaveBeenCalled();
  });

  it('changes the type from the row without opening the worker', async () => {
    const { user, navigate, changeType } = setup();
    await user.click(
      screen.getByRole('button', { name: 'Typ für Maddox Example ändern' })
    );
    expect(screen.getByRole('menuitemradio', { name: 'Team' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    await user.click(
      screen.getByRole('menuitemradio', { name: 'Offboarding' })
    );
    expect(changeType).toHaveBeenCalledExactlyOnceWith('offboarding');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not save when the current type is selected again', async () => {
    const { user, changeType } = setup();
    await user.click(
      screen.getByRole('button', { name: 'Typ für Maddox Example ändern' })
    );
    await user.click(screen.getByRole('menuitemradio', { name: 'Team' }));
    expect(changeType).not.toHaveBeenCalled();
  });

  it('only disables the type field while saving and still opens the worker from its name', async () => {
    const { user, navigate } = setup(true);
    expect(
      screen.getByRole('button', { name: 'Typ für Maddox Example ändern' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', {
        name: 'Verantwortlichen für Maddox Example ändern',
      })
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Typ für Maddox Example ändern' })
    ).toHaveAttribute('aria-busy', 'true');
    await user.click(screen.getByText('Maddox'));
    expect(navigate).toHaveBeenCalledExactlyOnceWith(
      'worker-1',
      'onboarding',
      'Maddox Example'
    );
  });

  it('blocks opening the worker while a type menu is open', async () => {
    const { user, navigate } = setup();
    await user.click(
      screen.getByRole('button', { name: 'Typ für Maddox Example ändern' })
    );
    expect(
      screen.getByRole('menuitemradio', { name: 'Team' })
    ).toBeInTheDocument();
    expect(getComputedStyle(screen.getByText('Maddox')).pointerEvents).toBe(
      'none'
    );
    expect(navigate).not.toHaveBeenCalled();
  });
});

it('omits task and status cells when the list is in Team mode', () => {
  setup(false, true);
  expect(screen.getAllByRole('cell')).toHaveLength(3);
});
