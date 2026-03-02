import { EmployeeModalProvider } from '@/context/Provider';
import EmployeeOverview from '@/features/employee-overview/components/EmployeeOverview';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/employee-overview')({
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
