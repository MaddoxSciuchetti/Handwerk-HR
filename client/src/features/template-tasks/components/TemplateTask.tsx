import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/selfmade/button';
import {
  Table,
  TableDivider,
  TableHeader,
} from '@/components/ui/selfmade/table/Table';
import { SettingsStatusesHeader } from '@/features/settings/org-statuses/SettingsStatusesHeader';
import TemplateSidebar from '@/features/task-management/components/tasks/task-sidebar/TemplateSidebar';
import { useState } from 'react';
import { useGetTemplates } from '../hooks/useGetTemplates';
import { TemplateItem } from './TemplateItem';

export type TemplateEditState = {
  templateId: string;
  templateName: string;
  templateDescription: string | null;
  templateType: string | null;
};

function TemplateTasks() {
  const { data: templates, isLoading } = useGetTemplates();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditTemplate, setIsEditTemplate] = useState<TemplateEditState>({
    templateId: '',
    templateName: '',
    templateDescription: null,
    templateType: null,
  });
  const [templateState, setTemplateState] = useState<'create' | 'edit'>(
    'create'
  );
  if (isLoading) {
    return <LoadingAlert />;
  }

  return (
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 md:max-w-8xl">
      <div className="h-full w-full flex flex-col items-center justify-center">
        <SettingsStatusesHeader
          title="Template Aufgaben"
          description="Verwalte deine Template Aufgaben"
        />
        <Table className="w-200">
          <TableHeader className="gap-3 py-2">
            <Button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setTemplateState('create');
              }}
            >
              Hinzufügen
            </Button>
          </TableHeader>
          <TableDivider />
          <TemplateItem
            templates={templates ?? []}
            setIsEditTemplate={setIsEditTemplate}
            setIsOpen={setIsOpen}
            templateState={templateState}
            setTemplateState={setTemplateState}
          />
        </Table>
        <TemplateSidebar
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          templateEditState={isEditTemplate}
          templateState={templateState}
        />
      </div>
    </div>
  );
}

export default TemplateTasks;
