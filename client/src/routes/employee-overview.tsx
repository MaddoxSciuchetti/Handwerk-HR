import EmployeeOverview from '@/features/employee-overview/components/EmployeeOverview';
import { EmployeeModalProvider } from '@/features/employee-overview/context/ModalProvider';
import { RouterContext } from '@/router';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/employee-overview')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (context.auth.user?.user_permission !== 'CHEF') {
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
