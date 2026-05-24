import { EmployeeModalProvider } from '@/features/employee-overview/context/ModalProvider';
import Employees from '@/features/settings/employees/Employees';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/employees')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <EmployeeModalProvider>
      <Employees />
    </EmployeeModalProvider>
  );
}
