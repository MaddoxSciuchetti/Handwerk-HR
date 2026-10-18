import { Route as RootRoute } from '@/routes/__root';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';

vi.mock('@/components/layout/Layout', async () => {
  const { Outlet } = await import('@tanstack/react-router');
  return {
    default: () => (
      <div data-testid="settings-layout">
        <Outlet />
      </div>
    ),
  };
});
vi.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: ReactNode }) => children,
}));

it('keeps the editor in its layout until the preview route is ready', async () => {
  let finishPreview!: () => void;
  const previewReady = new Promise<void>((resolve) => {
    finishPreview = resolve;
  });
  const root = createRootRoute({ component: RootRoute.options.component });
  const editor = createRoute({
    getParentRoute: () => root,
    path: '/settings/questionnaire',
    component: () => <p>Questionnaire editor</p>,
  });
  const preview = createRoute({
    getParentRoute: () => root,
    path: '/fragebogen/preview',
    loader: () => previewReady,
    component: () => <p>Questionnaire preview</p>,
  });
  const router = createRouter({
    routeTree: root.addChildren([editor, preview]),
    history: createMemoryHistory({
      initialEntries: ['/settings/questionnaire'],
    }),
    defaultPendingMs: 60_000,
  });
  render(<RouterProvider router={router} />);
  await screen.findByText('Questionnaire editor');
  expect(screen.getByTestId('settings-layout')).toContainElement(
    screen.getByText('Questionnaire editor')
  );

  let navigation!: Promise<void>;
  await act(async () => {
    navigation = router.navigate({ to: '/fragebogen/preview' });
  });
  expect(router.state.location.pathname).toBe('/fragebogen/preview');
  expect(screen.getByTestId('settings-layout')).toContainElement(
    screen.getByText('Questionnaire editor')
  );

  await act(async () => {
    finishPreview();
    await navigation;
  });
  expect(await screen.findByText('Questionnaire preview')).toBeInTheDocument();
  expect(screen.queryByTestId('settings-layout')).not.toBeInTheDocument();
});
