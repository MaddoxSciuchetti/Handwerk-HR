import TemplateTasks from '@/features/template-tasks/components/TemplateTask';
import { TaskContextProvider } from '@/features/template-tasks/TaskContextProvider';
import { userProfileQueries } from '@/features/user-profile/query-options/queries/user-profile.queries';
import { tryCatch } from '@/lib/trycatch';
import { RouterContext } from '@/router';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/template')({
  beforeLoad: async ({ context }: { context: RouterContext }) => {
    const [user] = await tryCatch(
      context.queryClient.ensureQueryData(userProfileQueries.User())
    );

    if (!user || user.user_permission !== 'CHEF') {
      throw redirect({ to: '/login' });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <TaskContextProvider>
      <TemplateTasks />
    </TaskContextProvider>
  );
}
