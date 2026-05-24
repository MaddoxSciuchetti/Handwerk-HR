import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/button';
import { ScrollableTableViewport } from '@/components/ui/scrollable-table-viewport';
import {
  Table,
  TableDivider,
  TableHeader,
} from '@/features/settings/components/Table';
import { SettingsPageHeader } from '@/features/settings/components/SettingsPageHeader';

import { TemplateSidebar } from '@/features/worker-task-management/components/tasks/task-sidebar/TemplateSidebar';
import { useState } from 'react';
import { useGetTemplates } from '../hooks/useGetTemplates';
import { TemplateItem } from './TemplateItem';

export type TemplateEditState = {
  templateId: string;
  name: string;
  description: string | null;
};

function Templates() {
  const { data: templates, isLoading } = useGetTemplates();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditTemplate, setIsEditTemplate] = useState<TemplateEditState>({
    templateId: '',
    name: '',
    description: null,
  });
  const [templateState, setTemplateState] = useState<'create' | 'edit'>(
    'create'
  );
  const [createOpenNonce, setCreateOpenNonce] = useState(0);

  if (isLoading) {
    return <LoadingAlert />;
  }

  return (
    <div className="mx-auto flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <div className="flex h-full min-h-0 w-full flex-col">
        <SettingsPageHeader
          title="Template Aufgaben"
          description="Verwalte deine Template Aufgaben"
        />
        <Table className="min-h-0 flex-1 w-200">
          <TableHeader>
            <Button
              type="button"
              className="rounded-full"
              onClick={() => {
                setCreateOpenNonce((n) => n + 1);
                setIsOpen(true);
                setTemplateState('create');
              }}
            >
              Hinzufügen
            </Button>
          </TableHeader>
          <TableDivider />
          <ScrollableTableViewport>
            <TemplateItem
              templates={templates ?? []}
              setIsEditTemplate={setIsEditTemplate}
              setIsOpen={setIsOpen}
              setTemplateState={setTemplateState}
            />
          </ScrollableTableViewport>
        </Table>
        <TemplateSidebar
          key={
            templateState === 'edit'
              ? `edit-${isEditTemplate.templateId}`
              : `create-${createOpenNonce}`
          }
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          templateEditState={isEditTemplate}
          templateState={templateState}
        />
      </div>
    </div>
  );
}

export default Templates;
