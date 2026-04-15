import { Button } from '@/components/ui/selfmade/button';
import {
  Table,
  TableDivider,
  TableHeader,
} from '@/components/ui/selfmade/table/Table';
import { SettingsStatusesHeader } from '@/features/settings/org-statuses/SettingsStatusesHeader';
import { TaskSidebar } from '@/features/task-management/components/tasks/TaskSidebar';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

type TemplateTasksProps = {
  templateId: string;
  templateName: string;
};

export function TemplateTasks({
  templateId,
  templateName,
}: TemplateTasksProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 md:max-w-8xl">
      <div className="h-full w-full flex flex-col items-center justify-center">
        <SettingsStatusesHeader
          action={
            <Button
              type="button"
              hierachy="ghost"
              className="size-9 p-0"
              aria-label="Zurück"
              onClick={() => navigate({ to: '/settings/templates/template' })}
            >
              <ArrowLeft className="size-5" />
            </Button>
          }
          title={templateName}
          description="Füge Aufgaben zu dieser Vorlage hinzu"
        />
        <Table className="w-200">
          <TableHeader className="gap-3 py-2">
            <Button onClick={() => setIsOpen(true)}>Hinzufügen</Button>
          </TableHeader>
          <TableDivider />
        </Table>
        <TaskSidebar
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          templateId={templateId}
        />
      </div>
    </div>
  );
}
