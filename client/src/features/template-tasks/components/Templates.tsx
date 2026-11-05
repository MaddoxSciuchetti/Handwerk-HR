import { TableSkeletonRows } from '@/components/ui/table-skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  alignedSettingsTableClassName,
  settingsTableCardClassName,
  settingsTableBodyClassName,
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

  return (
    <div className="mx-auto flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <div className="flex h-full min-h-0 w-full flex-col items-center gap-5">
        <section className="flex min-h-0 w-full flex-1 flex-col">
          <SettingsPageHeader title="Template Aufgaben" />
          <Card className={settingsTableCardClassName}>
            <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-0 pb-0">
              <ScrollableTableViewport>
                <Table
                  aria-busy={isLoading}
                  className={alignedSettingsTableClassName}
                >
                  <colgroup>
                    <col />
                    <col className="w-40" />
                  </colgroup>
                  <TableHeader className="sticky top-0 z-10 bg-card [&_tr]:border-b-0">
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableHead className="h-12 bg-card py-3 pl-10">
                        Name
                      </TableHead>
                      <TableHead className="bg-card py-3 pr-6 text-right">
                        <span className="sr-only">Aktionen</span>
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
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className={settingsTableBodyClassName}>
                    {isLoading ? (
                      <TableSkeletonRows variant="templates" />
                    ) : (
                      <TemplateItem
                        templates={templates ?? []}
                        setIsEditTemplate={setIsEditTemplate}
                        setIsOpen={setIsOpen}
                        setTemplateState={setTemplateState}
                      />
                    )}
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
