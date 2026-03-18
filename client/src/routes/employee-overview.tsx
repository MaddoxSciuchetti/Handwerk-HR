import EmployeeOverview from '@/features/employee-overview/components/EmployeeOverview';
import { EmployeeModalProvider } from '@/features/employee-overview/context/ModalProvider';
import { userProfileQueries } from '@/features/user-profile/query-options/queries/user-profile.queries';
import { tryCatch } from '@/lib/trycatch';
import { RouterContext } from '@/router';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/employee-overview')({
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
    <>
      <EmployeeModalProvider>
        <EmployeeOverview />
      </EmployeeModalProvider>
    </>
  );
}
