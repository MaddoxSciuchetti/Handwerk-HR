import { DocumentsPage } from '@/features/settings/documents/DocumentsPage';
import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/documents')({
  component: DocumentsLayout,
});

function DocumentsLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isIndex =
    pathname === '/settings/documents' || pathname === '/settings/documents/';

  if (isIndex) {
    return <DocumentsPage />;
  }

  return <Outlet />;
}
