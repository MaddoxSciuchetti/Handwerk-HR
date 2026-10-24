import { SidebarAside } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarAside';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Dialog } from 'radix-ui';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

function SidebarHarness() {
  const [open, setOpen] = useState(true);
  return (
    <SidebarAside
      isOpen={open}
      onClose={() => setOpen(false)}
      data-testid="sidebar"
    >
      <input aria-label="Betreff" />
    </SidebarAside>
  );
}

describe('sidebar Escape handling', () => {
  it.each(['input', 'window'])(
    'closes the panel with focus on %s',
    (target) => {
      render(<SidebarHarness />);
      fireEvent.keyDown(
        target === 'input' ? screen.getByLabelText('Betreff') : window,
        { key: 'Escape' }
      );
      expect(screen.getByTestId('sidebar')).toHaveAttribute(
        'data-state',
        'closed'
      );
      expect(screen.getByTestId('sidebar')).toHaveAttribute('inert');
    }
  );

  it('ignores closed panels and removes its listener on unmount', () => {
    const close = vi.fn();
    const { rerender, unmount } = render(
      <SidebarAside isOpen onClose={close} />
    );
    rerender(<SidebarAside isOpen={false} onClose={close} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(close).not.toHaveBeenCalled();
    rerender(<SidebarAside isOpen onClose={close} />);
    unmount();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(close).not.toHaveBeenCalled();
  });

  it('only closes the top panel when multiple sidebars are open', () => {
    const lowerClose = vi.fn();
    function Panels() {
      const [upperOpen, setUpperOpen] = useState(true);
      return (
        <>
          <SidebarAside isOpen onClose={lowerClose} />
          <SidebarAside
            isOpen={upperOpen}
            onClose={() => setUpperOpen(false)}
            data-testid="upper"
          />
        </>
      );
    }
    render(<Panels />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByTestId('upper')).toHaveAttribute('data-state', 'closed');
    expect(lowerClose).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(lowerClose).toHaveBeenCalledOnce();
  });

  it('lets a nested editor consume Escape before closing the sidebar', () => {
    const close = vi.fn();
    render(
      <SidebarAside isOpen onClose={close}>
        <input
          aria-label="Editor"
          onKeyDown={(event) => event.preventDefault()}
        />
      </SidebarAside>
    );
    fireEvent.keyDown(screen.getByLabelText('Editor'), { key: 'Escape' });
    expect(close).not.toHaveBeenCalled();
  });

  it('dismisses a nested dialog first, then closes the sidebar on the next Escape', async () => {
    const close = vi.fn();
    render(
      <SidebarAside isOpen onClose={close}>
        <Dialog.Root defaultOpen>
          <Dialog.Content aria-describedby={undefined}>
            <Dialog.Title>Dialog</Dialog.Title>
            <input aria-label="Dialogfeld" />
          </Dialog.Content>
        </Dialog.Root>
      </SidebarAside>
    );
    fireEvent.keyDown(screen.getByLabelText('Dialogfeld'), { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(close).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(close).toHaveBeenCalledOnce();
  });
});
