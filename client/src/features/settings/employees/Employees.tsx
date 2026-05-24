import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Cell,
  employeeTableGridClassName,
  ItemHeader,
  Table,
  TableDivider,
  TableHeader,
} from '@/features/settings/components/Table';
import EmployeeItemList from '@/features/employee-overview/components/items/EmployeeItemList';
import EmployeeSidebar from '@/features/employee-overview/components/sidebar/EmployeeSidebar';
import useDeleteEmployee from '@/features/employee-overview/hooks/useDeleteEmployee';
import useGetEmployees from '@/features/employee-overview/hooks/useGetEmployees';
import { EmployeeDataArray } from '@/features/employee-overview/schemas/schema';
import { useState } from 'react';
import { useSendInvite } from '../hooks/useSendInvite';
import { SettingsHeader } from './SettingsHeader';

function Employees() {
  const { isPending, handleSendInvite, mitarbeiterEmail, setMitarbeiterEmail } =
    useSendInvite();
  const { EmployeeData, isLoading } = useGetEmployees();
  const { handleDeleteEmployee, isPending: isDeleting } = useDeleteEmployee();
  const [selectedEmployee, setSelectedEmployee] = useState<
    EmployeeDataArray[number] | null
  >(null);

  if (isLoading || isDeleting) return <LoadingAlert />;

  return (
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <div className="h-full w-full flex flex-col items-center justify-center">
        <SettingsHeader />
        <Table className="w-200 ">
          <TableHeader>
            <Button
              className="rounded-full text-sm"
              disabled={isPending}
              onClick={handleSendInvite}
            >
              {isPending ? 'Sende...' : 'Hinzufügen'}
            </Button>
            <Input
              placeholder="Mitarbeite Email"
              value={mitarbeiterEmail}
              onChange={(e) => setMitarbeiterEmail(e.target.value)}
            />
          </TableHeader>
          <TableDivider />
          <ItemHeader className={employeeTableGridClassName}>
            <div className="typo-body-sm min-w-0 truncate pl-7 py-1">Name</div>
            <div className="typo-body-xs text-left leading-tight">
              Offene
              <br />
              Aufgaben
            </div>
            <div className="typo-body-sm text-left">Status</div>
            <div className="typo-body-sm text-left">Vertretung</div>
            <div className="typo-body-sm text-left">Aktionen</div>
          </ItemHeader>
          <EmployeeItemList
            employees={EmployeeData ?? []}
            handleDeleteEmployee={handleDeleteEmployee}
            onSelectEmployee={setSelectedEmployee}
          />
        </Table>
      </div>
      <EmployeeSidebar
        employee={selectedEmployee}
        isOpen={selectedEmployee !== null}
        onClose={() => setSelectedEmployee(null)}
      />
    </div>
  );
}

export default Employees;
