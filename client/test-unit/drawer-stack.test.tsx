import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import {
  DrawerLayer,
  DrawerStackProvider,
  useDrawerStack,
} from '@/components/ui/drawer-stack';
import { SidebarAside } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarAside';

function Detail() {
  const drawers = useDrawerStack();
  return (
    <>
      <input aria-label="Editor draft" defaultValue="unsaved" />
      <button onClick={() => drawers?.push('Preview', <p>Preview body</p>)}>
        Preview
      </button>
    </>
  );
}
function List() {
  const drawers = useDrawerStack();
  const [formOpen, setFormOpen] = useState(false);
  return (
    <>
      <input aria-label="List filter" defaultValue="saved filter" />
      <button onClick={() => drawers?.push('Detail', <Detail />)}>
        Open item
      </button>
      <button onClick={() => setFormOpen(true)}>Add item</button>
      <SidebarAside
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        aria-label="Add form"
      >
        <input aria-label="New item" />
      </SidebarAside>
    </>
  );
}
function Harness({ width }: { width?: string } = {}) {
  const [open, setOpen] = useState(true);
  return (
    <DrawerStackProvider>
      <DrawerLayer
        open={open}
        title="List"
        onClose={() => setOpen(false)}
        style={width ? { width } : undefined}
      >
        <List />
      </DrawerLayer>
    </DrawerStackProvider>
  );
}
afterEach(() => vi.useRealTimers());

describe('stacked drawers', () => {
  it('expands only the width and restores without losing edits', () => {
    render(<Harness width="60vw" />);
    const drawer = screen.getByRole('dialog', { name: 'List' });
    const originalWidth = drawer.style.width;
    const originalTop = drawer.style.top;
    const originalBottom = drawer.style.bottom;
    fireEvent.change(screen.getByLabelText('List filter'), {
      target: { value: 'keep this filter' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ansicht erweitern' }));
    // Inset with left/right — never 100vw (scrollbar gutter overshoot).
    expect(drawer.style.width).toBe('auto');
    expect(drawer.style.left).toBe('4px');
    expect(drawer.style.right).toBe('4px');
    expect(drawer.style.top).toBe(originalTop);
    expect(drawer.style.bottom).toBe(originalBottom);
    expect(drawer).toHaveClass('rounded-[26px]');
    expect(drawer.style.borderRadius).toBe('');
    fireEvent.click(
      screen.getByRole('button', { name: 'Ansicht verkleinern' })
    );
    expect(drawer.style.width).toBe(originalWidth);
    expect(screen.getByLabelText('List filter')).toHaveValue(
      'keep this filter'
    );
  });

  it('opens progressively smaller layers and pops only the top layer on each left click', () => {
    vi.useFakeTimers();
    render(<Harness />);
    fireEvent.click(screen.getByText('Open item'));
    const detail = screen.getByRole('dialog', { name: 'Detail' });
    expect(detail).toHaveAttribute('data-drawer-layer', '2');
    expect(detail.style.top).toBe('8px');
    fireEvent.change(screen.getByLabelText('Editor draft'), {
      target: { value: 'keep this edit' },
    });
    fireEvent.click(screen.getByText('Preview'));
    expect(screen.getByRole('dialog', { name: 'Preview' })).toHaveAttribute(
      'data-drawer-layer',
      '3'
    );
    expect(detail).toHaveAttribute('inert');
    const backdrops = screen.getAllByRole('button', {
      name: 'Zurück zur vorherigen Ebene',
    });
    fireEvent.click(
      backdrops.find((button) => !button.hasAttribute('disabled'))!
    );
    expect(screen.getByRole('dialog', { name: 'Detail' })).toBe(detail);
    expect(screen.getByLabelText('Editor draft')).toHaveValue('keep this edit');
    act(() => vi.advanceTimersByTime(220));
    fireEvent.click(
      screen
        .getAllByRole('button', { name: 'Zurück zur vorherigen Ebene' })
        .find((button) => !button.hasAttribute('disabled'))!
    );
    expect(screen.getByLabelText('List filter')).toHaveValue('saved filter');
    act(() => vi.advanceTimersByTime(220));
    fireEvent.click(
      screen.getByRole('button', { name: 'Zurück zur vorherigen Ebene' })
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(220));
    expect(document.querySelector('[data-drawer-layer]')).toBeNull();
  });

  it('closes only the deepest layer on Escape, including existing sidebar forms', () => {
    vi.useFakeTimers();
    render(<Harness />);
    fireEvent.click(screen.getByText('Add item'));
    expect(screen.getByRole('dialog', { name: 'Add form' })).toHaveAttribute(
      'data-drawer-layer',
      '2'
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByRole('dialog', { name: 'List' })).toBeInTheDocument();
    expect(
      screen.queryByRole('dialog', { name: 'Add form' })
    ).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(220));
    fireEvent.click(screen.getByText('Open item'));
    fireEvent.click(screen.getByText('Preview'));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByRole('dialog', { name: 'Detail' })).toBeInTheDocument();
    expect(
      screen.queryByRole('dialog', { name: 'Preview' })
    ).not.toBeInTheDocument();
  });

  it('lets nested controls consume Escape and keeps the editor mounted', () => {
    render(
      <DrawerStackProvider>
        <DrawerLayer open title="Editor" onClose={vi.fn()}>
          <input
            aria-label="Field"
            onKeyDown={(event) => event.preventDefault()}
          />
        </DrawerLayer>
      </DrawerStackProvider>
    );
    fireEvent.keyDown(screen.getByLabelText('Field'), { key: 'Escape' });
    expect(
      within(screen.getByRole('dialog', { name: 'Editor' })).getByLabelText(
        'Field'
      )
    ).toBeInTheDocument();
  });
});
