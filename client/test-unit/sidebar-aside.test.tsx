import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { SidebarAside } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarAside';

function Harness() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open
      </button>
      <button type="button" onClick={() => setIsOpen(false)}>
        Close
      </button>
      <SidebarAside isOpen={isOpen}>Panel</SidebarAside>
    </>
  );
}

describe('SidebarAside', () => {
  it('stays parked off-screen until it has been opened', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const panel = screen.getByText('Panel');
    expect(panel).toHaveAttribute('data-state', 'idle');

    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(panel).toHaveAttribute('data-state', 'open');

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(panel).toHaveAttribute('data-state', 'closed');
  });
});
