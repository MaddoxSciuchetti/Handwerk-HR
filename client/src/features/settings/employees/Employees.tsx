import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import EmployeeItemList from '@/features/employee-overview/components/items/EmployeeItemList';
import EmployeeSidebar from '@/features/employee-overview/components/sidebar/EmployeeSidebar';
import useDeleteEmployee from '@/features/employee-overview/hooks/useDeleteEmployee';
import useGetEmployees from '@/features/employee-overview/hooks/useGetEmployees';
import { EmployeeDataArray } from '@/features/employee-overview/schemas/schema';
import { useState } from 'react';
import { useSendInvite } from '../hooks/useSendInvite';
import { SettingsHeader } from './SettingsHeader';
import {
  settingsTableBodyClassName,
  settingsTableClassName,
} from '@/features/settings/components/settingsTable';

function Employees() {
  const { isPending, handleSendInvite, mitarbeiterEmail, setMitarbeiterEmail } =
    useSendInvite();
  const { EmployeeData, isLoading } = useGetEmployees();
  const { handleDeleteEmployee, isPending: isDeleting } = useDeleteEmployee();
  const [selectedEmployee, setSelectedEmployee] = useState<
    EmployeeDataArray[number] | null
  >(null);

  if (isLoading || isDeleting) {
    return <LoadingAlert className="mt-10 min-h-40" />;
  }

  return (
    <section className="mt-10 flex w-full flex-col items-stretch">
      <div className="flex w-full flex-col items-stretch">
        <SettingsHeader />
        <Card className="mt-5 flex w-full flex-col gap-0 border border-border py-0 shadow-none ring-0">
          <CardHeader className="flex flex-row items-center justify-end gap-3 px-6 py-3">
            <Input
              placeholder="Mitarbeite Email"
              value={mitarbeiterEmail}
              onChange={(e) => setMitarbeiterEmail(e.target.value)}
              className="max-w-sm shadow-none focus-visible:border-border focus-visible:ring-0"
            />
            <Button
              className="rounded-2xl text-sm"
              disabled={isPending}
              onClick={handleSendInvite}
            >
              {isPending ? 'Sende...' : 'Hinzufügen'}
            </Button>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <Table className={settingsTableClassName}>
              <TableHeader className="[&_tr]:border-b-0">
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead className="h-12 py-3 pl-10">Name</TableHead>
                  <TableHead className="py-3 px-2">Offene Aufgaben</TableHead>
                  <TableHead className="py-3 px-2">Status</TableHead>
                  <TableHead className="py-3 px-2">Vertretung</TableHead>
                  <TableHead className="py-3 px-2">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={settingsTableBodyClassName}>
                <EmployeeItemList
                  employees={EmployeeData ?? []}
                  handleDeleteEmployee={handleDeleteEmployee}
                  onSelectEmployee={setSelectedEmployee}
                />
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <EmployeeSidebar
        employee={selectedEmployee}
        isOpen={selectedEmployee !== null}
        onClose={() => setSelectedEmployee(null)}
      />
    </section>
  );
}

export default Employees;
