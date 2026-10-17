import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollableTableViewport } from '@/components/ui/scrollable-table-viewport';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SettingsPageHeader } from '@/features/settings/components/SettingsPageHeader';
import {
  settingsTableBodyClassName,
  settingsTableClassName,
} from '@/features/settings/components/settingsTable';

import { TemplateSidebar } from '@/features/worker-task-management/components/tasks/task-sidebar/TemplateSidebar';
import { useState } from 'react';
import { useGetTemplates } from '../hooks/useGetTemplates';
import { MailTemplateTable } from './MailTemplateTable';
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
      <div className="flex h-full min-h-0 w-full flex-col items-center gap-5">
        <section className="flex min-h-0 w-full flex-1 flex-col">
          <SettingsPageHeader title="Template Aufgaben" />
          <Card className="mt-5 flex min-h-0 w-full flex-1 flex-col gap-0 border border-border py-0 shadow-none ring-0">
            <CardHeader className="flex shrink-0 flex-row items-center justify-end px-6 py-3">
              <Button
                type="button"
                className="rounded-2xl"
                onClick={() => {
                  setCreateOpenNonce((n) => n + 1);
                  setIsOpen(true);
                  setTemplateState('create');
                }}
              >
                Hinzufügen
              </Button>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-0">
              <ScrollableTableViewport>
                <Table className={settingsTableClassName}>
                  <TableHeader className="sticky top-0 z-10 bg-card [&_tr]:border-b-0">
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableHead className="h-12 bg-card py-3 pl-10">
                        Name
                      </TableHead>
                      <TableHead className="bg-card py-3 px-2">
                        Beschreibung
                      </TableHead>
                      <TableHead className="bg-card py-3 pr-6 text-right">
                        Aktionen
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className={settingsTableBodyClassName}>
                    <TemplateItem
                      templates={templates ?? []}
                      setIsEditTemplate={setIsEditTemplate}
                      setIsOpen={setIsOpen}
                      setTemplateState={setTemplateState}
                    />
                  </TableBody>
                </Table>
              </ScrollableTableViewport>
            </CardContent>
          </Card>
        </section>
        <MailTemplateTable />
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
