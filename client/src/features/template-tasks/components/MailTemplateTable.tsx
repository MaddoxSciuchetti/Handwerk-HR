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
  alignedSettingsTableClassName,
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
  const { data: customTemplates } = useMailTemplates();
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
      <Card className="mt-5 flex min-h-0 w-full flex-1 flex-col gap-0 border border-border py-0 shadow-none ring-0">
        <CardHeader className="flex shrink-0 flex-row items-center justify-end px-6 py-3">
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
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-0">
          <ScrollableTableViewport>
            <Table className={alignedSettingsTableClassName}>
              <colgroup>
                <col className="w-72" />
                <col />
                <col className="w-32" />
              </colgroup>
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
                <MailTemplateRow
                  templates={rows}
                  setIsOpen={setIsOpen}
                  setMode={setMode}
                  setEditState={setEditState}
                  onOpen={(template) => {
                    setIsOpen(false);
                    void navigate({
                      to: '/settings/mail-templates/$id',
                      params: { id: template.id },
                    });
                  }}
                />
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
