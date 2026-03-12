import EmployeeOverview from '@/features/employee-overview/components/EmployeeOverview';
import { EmployeeModalProvider } from '@/features/employee-overview/context/ModalProvider';
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
