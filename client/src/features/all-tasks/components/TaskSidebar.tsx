import FormFields from '@/components/form/FormFields';
import FormSelectOptions from '@/components/form/FormSelectOptions';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/selfmade/button';
import { FormWrapper } from '@/components/ui/selfmade/form-wrapper';
import { employeeQueries } from '@/features/employee-overview/query-options/queries/employee.queries';
import { fetchOrgStatuses } from '@/features/settings/org-statuses/org-status.api';
import { SidebarAside } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarAside';
import SidebarContent from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarContent';
import SidebarFooter from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarFooter';
import SidebarHeader from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarHeader';
import { SidebarPanel } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarPanel';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

type TaskSidebarForm = {
  title: string;
  assigneeUserId: string;
  statusId: string;
};

type TaskSidebarProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export function TaskSidebar({ isOpen, setIsOpen }: TaskSidebarProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TaskSidebarForm>({
    defaultValues: { title: '', assigneeUserId: '', statusId: '' },
  });

  const { data: employees = [] } = useQuery(employeeQueries.getEmployees());
  const { data: statuses = [] } = useQuery({
    queryKey: ['org', 'statuses', 'issue'],
    queryFn: () => fetchOrgStatuses('issue'),
    enabled: isOpen,
  });

  const ownerOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: `${e.vorname} ${e.nachname}`,
      })),
    [employees]
  );

  const statusOptions = useMemo(
    () =>
      statuses.map((s) => ({
        value: s.id,
        label: s.name,
      })),
    [statuses]
  );

  return (
    <>
      <SidebarAside className="p-2" isOpen={isOpen}>
        <SidebarPanel className="w-full">
          <SidebarHeader className="flex items-center justify-between p-6">
            <Label className="typo-body-lg font-bold">Aufgabe</Label>
            <Button
              type="button"
              aria-label="Schließen"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </SidebarHeader>
          <FormWrapper
            onSubmit={handleSubmit(() => {})}
            className="flex min-h-0 flex-1 flex-col"
          >
            <SidebarContent className="mt-5 flex flex-col gap-4 p-6">
              <FormFields
                errors={errors}
                register={register}
                name="title"
                label="Aufgabe"
                labelClassName="typo-body-base"
                placeholder="Titel"
              />
              <FormSelectOptions
                name="assigneeUserId"
                control={control}
                data={ownerOptions}
                placeholder="Zuständig"
                errors={errors}
                label="Zuständigkeit"
                labelClassName="typo-body-base"
              />
              <FormSelectOptions
                name="statusId"
                control={control}
                data={statusOptions}
                placeholder="Status"
                errors={errors}
                label="Status"
                labelClassName="typo-body-base"
              />
            </SidebarContent>
            <SidebarFooter className="p-6">
              <Button type="submit">Speichern</Button>
            </SidebarFooter>
          </FormWrapper>
        </SidebarPanel>
      </SidebarAside>
    </>
  );
}
