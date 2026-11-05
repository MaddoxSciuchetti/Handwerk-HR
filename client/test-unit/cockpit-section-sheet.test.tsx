import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CockpitSectionSheet } from '@/features/worker-lifecycle/components/CockpitSectionSheet';
import { SidebarAside } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarAside';

vi.mock('@/features/worker-lifecycle/components/cockpitSections', () => ({
  COCKPIT_SECTIONS: ['templates', 'documents', 'questionnaire', 'bestand'].map(
    (id) => ({ id, title: id })
  ),
  CockpitSectionBody: ({ id }: { id: string }) => <p>{id} content</p>,
}));

afterEach(() => vi.useRealTimers());

describe('CockpitSectionSheet', () => {
  it.each(['templates', 'documents', 'questionnaire', 'bestand'] as const)(
    'mounts %s content on click without waiting for the animation',
    (section) => {
      const { rerender } = render(
        <CockpitSectionSheet
          openSection={null}
          isLoading={false}
          onOpenChange={vi.fn()}
        />
      );
      rerender(
        <CockpitSectionSheet
          openSection={section}
          isLoading={false}
          onOpenChange={vi.fn()}
        />
      );
      expect(screen.getByText(`${section} content`)).toBeInTheDocument();
    }
  );

  it('updates immediately when switching sections and retains content through closing', () => {
    vi.useFakeTimers();
    const props = { isLoading: false, onOpenChange: vi.fn() };
    const { rerender } = render(
      <CockpitSectionSheet {...props} openSection="templates" />
    );
    rerender(<CockpitSectionSheet {...props} openSection="documents" />);
    expect(screen.queryByText('templates content')).not.toBeInTheDocument();
    expect(screen.getByText('documents content')).toBeInTheDocument();
    rerender(<CockpitSectionSheet {...props} openSection={null} />);
    expect(screen.getByText('documents content')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(220));
    expect(screen.queryByText('documents content')).not.toBeInTheDocument();
  });

  it('cancels closing cleanup when reopened quickly', () => {
    vi.useFakeTimers();
    const props = { isLoading: false, onOpenChange: vi.fn() };
    const { rerender } = render(
      <CockpitSectionSheet {...props} openSection="templates" />
    );
    rerender(<CockpitSectionSheet {...props} openSection={null} />);
    act(() => vi.advanceTimersByTime(100));
    rerender(<CockpitSectionSheet {...props} openSection="bestand" />);
    act(() => vi.advanceTimersByTime(220));
    expect(screen.getByText('bestand content')).toBeInTheDocument();
  });

  it('lets a nested sidebar close first even when opened after the drawer', () => {
    const closeDrawer = vi.fn();
    const closeNested = vi.fn();
    const { rerender } = render(
      <>
        <CockpitSectionSheet
          openSection="templates"
          isLoading={false}
          onOpenChange={closeDrawer}
        />
        <SidebarAside isOpen={false} onClose={closeNested}>
          Nested panel
        </SidebarAside>
      </>
    );
    rerender(
      <>
        <CockpitSectionSheet
          openSection="templates"
          isLoading={false}
          onOpenChange={closeDrawer}
        />
        <SidebarAside isOpen onClose={closeNested}>
          Nested panel
        </SidebarAside>
      </>
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(closeNested).toHaveBeenCalledOnce();
    expect(closeDrawer).not.toHaveBeenCalled();
  });
});
