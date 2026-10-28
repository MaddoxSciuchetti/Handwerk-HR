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
      <SidebarAside isOpen={isOpen} onClose={() => setIsOpen(false)}>
        Panel
      </SidebarAside>
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

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.keyboard('{Escape}');

    expect(screen.getByText('Panel')).toHaveAttribute('data-state', 'closed');
  });

  it('leaves Escape to an overlay that already handled it', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open' }));

    const claimEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') event.preventDefault();
    };
    document.addEventListener('keydown', claimEscape, { capture: true });
    await user.keyboard('{Escape}');
    document.removeEventListener('keydown', claimEscape, { capture: true });

    expect(screen.getByText('Panel')).toHaveAttribute('data-state', 'open');
  });
});
