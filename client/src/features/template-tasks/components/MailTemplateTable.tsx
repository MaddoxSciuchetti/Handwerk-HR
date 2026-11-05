import { useDrawerStack } from '@/components/ui/drawer-stack';
import { MailTemplatePage } from '@/features/settings/mail-template/MailTemplatePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TableSkeletonRows } from '@/components/ui/table-skeleton';
import { ScrollableTableViewport } from '@/components/ui/scrollable-table-viewport';
import {
  Table,
  TableBody,
  TableCell,
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
import { useMailTemplates } from '@/features/settings/mail-template/useMailTemplates';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  MailTemplateSidebar,
  type MailTemplateEditState,
} from './MailTemplateSidebar';
import { MailTemplateRow, type MailTemplateRowData } from './MailTemplateRow';

const EMPTY_EDIT: MailTemplateEditState = {
  id: '',
  name: '',
  description: '',
};

export function MailTemplateTable() {
  const navigate = useNavigate();
  const drawers = useDrawerStack();
  const { data: customTemplates, isLoading, isError } = useMailTemplates();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editState, setEditState] = useState<MailTemplateEditState>(EMPTY_EDIT);
  const [createOpenNonce, setCreateOpenNonce] = useState(0);

  const rows: MailTemplateRowData[] = (customTemplates ?? []).map(
    (template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
    })
  );

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col">
      <SettingsPageHeader title="E-Mails" />
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
                        setEditState(EMPTY_EDIT);
                        setCreateOpenNonce((nonce) => nonce + 1);
                        setMode('create');
                        setIsOpen(true);
                      }}
                    >
                      Hinzufügen
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={settingsTableBodyClassName}>
                {isLoading ? (
                  <TableSkeletonRows variant="templates" rows={1} />
                ) : isError || rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="h-24 text-muted-foreground"
                    >
                      {isError
                        ? 'E-Mail-Vorlagen konnten nicht geladen werden.'
                        : 'Noch keine E-Mail-Vorlagen vorhanden.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  <MailTemplateRow
                    templates={rows}
                    setIsOpen={setIsOpen}
                    setMode={setMode}
                    setEditState={setEditState}
                    onOpen={(template) => {
                      setIsOpen(false);
                      if (drawers) {
                        drawers.push(
                          template.name,
                          <MailTemplatePage templateId={template.id} />
                        );
                        return;
                      }
                      void navigate({
                        to: '/settings/mail-templates/$id',
                        params: { id: template.id },
                      });
                    }}
                  />
                )}
              </TableBody>
            </Table>
          </ScrollableTableViewport>
        </CardContent>
      </Card>
      <MailTemplateSidebar
        key={
          mode === 'edit' ? `edit-${editState.id}` : `create-${createOpenNonce}`
        }
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        mode={mode}
        editState={editState}
      />
    </section>
  );
}
