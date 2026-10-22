import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { WorkerSelectAllCheckbox } from '@/features/worker-lifecycle/components/WorkerSelectAllCheckbox';
import type { WorkerSelection } from '@/features/worker-lifecycle/components/ProjectItem';
import type { WorkerRecord } from '@/features/worker-lifecycle/types/index.types';

const workers = ['Ben', 'Lukas'].map((name) => ({
  id: name,
  firstName: name,
  lastName: 'Example',
  engagements: [{ id: `${name}-engagement`, type: 'onboarding' }],
})) as WorkerRecord[];
const selection = (id: string): WorkerSelection => ({
  engagementNumber: id,
  engagementTitle: id,
  engagementId: `${id}-engagement`,
  type: 'onboarding',
});
function Harness({ initial = [] }: { initial?: WorkerSelection[] }) {
  const [selected, setSelected] = useState(initial);
  return (
    <>
      <WorkerSelectAllCheckbox
        workers={workers}
        selected={selected}
        onChange={setSelected}
        disabled={false}
      />
      <output aria-label="Selected workers">
        {selected.map((item) => item.engagementNumber).join(',')}
      </output>
    </>
  );
}

describe('worker select all', () => {
  it('selects and deselects every worker in the list', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByLabelText('Selected workers')).toHaveTextContent(
      'Ben,Lukas'
    );
    await user.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByLabelText('Selected workers')).toBeEmptyDOMElement();
  });
  it('shows partial selection and preserves selections outside the current filter', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[selection('Ben'), selection('Hidden')]} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-checked',
      'mixed'
    );
    await user.click(screen.getByRole('checkbox'));
    expect(screen.getByLabelText('Selected workers')).toHaveTextContent(
      'Hidden,Ben,Lukas'
    );
    await user.click(screen.getByRole('checkbox'));
    expect(screen.getByLabelText('Selected workers')).toHaveTextContent(
      /^Hidden$/
    );
  });
  it('disables selection when there are no workers', () => {
    render(
      <WorkerSelectAllCheckbox
        workers={[]}
        selected={[]}
        onChange={() => {}}
        disabled={false}
      />
    );
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });
});
