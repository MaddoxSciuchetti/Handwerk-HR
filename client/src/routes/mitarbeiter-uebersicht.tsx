import EmployeeOverview from '@/features/employee-overview/components/EmployeeOverview';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/mitarbeiter-uebersicht')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <EmployeeOverview />
    </>
  );
}
