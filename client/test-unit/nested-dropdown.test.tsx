import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import {
  NestedDropdown,
  type DropdownOption,
} from '@/components/ui/nested-dropdown';

const options: DropdownOption[] = [
  { label: 'Alle', value: 'all' },
  {
    label: 'Typ',
    value: 'engagementType',
    subOptions: [
      { label: 'Onboarding', value: 'onboarding' },
      { label: 'Transfer', value: 'transfer' },
    ],
  },
];

function Harness() {
  const [label, setLabel] = useState('');

  return (
    <NestedDropdown
      options={options}
      value={label}
      placeholder="Filter"
      onSelect={(value) => {
        const option = options.find((item) => item.value === value);
        setLabel(option?.label ?? '');
      }}
      onSubSelect={(sub) => setLabel(sub.label)}
    />
  );
}

describe('NestedDropdown', () => {
  it('shows the selected filter instead of the placeholder', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Filter' }));
    await user.click(screen.getByRole('menuitem', { name: 'Alle' }));

    expect(screen.getByRole('button', { name: 'Alle' })).toBeInTheDocument();
  });
});
