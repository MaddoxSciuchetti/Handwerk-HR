import { userProfileQueries } from '@/features/user-profile/query-options/queries/user-profile.queries';
import { tryCatch } from '@/lib/trycatch';
import { RouterContext } from '@/router';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/template')({
  beforeLoad: async ({ context }: { context: RouterContext }) => {
    await tryCatch(
      context.queryClient.ensureQueryData(userProfileQueries.User())
    );
  },
  component: TemplateLayout,
});

function TemplateLayout() {
  return <Outlet />;
}
