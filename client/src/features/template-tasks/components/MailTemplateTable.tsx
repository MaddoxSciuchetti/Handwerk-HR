import { Card, CardContent } from '@/components/ui/card';
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
  settingsTableBodyClassName,
  settingsTableClassName,
} from '@/features/settings/components/settingsTable';
import { useNavigate } from '@tanstack/react-router';

const MAIL_TEMPLATES = [
  {
    name: 'Willkommensmail',
    to: '/settings/welcome-mail',
  },
  {
    name: 'Entlassungsmail',
    to: '/settings/departure-mail',
  },
] as const;

export function MailTemplateTable() {
  const navigate = useNavigate();

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col">
      <SettingsPageHeader title="E-Mails" />
      <Card className="mt-5 flex min-h-0 w-full flex-1 flex-col gap-0 border border-border py-0 shadow-none ring-0">
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-0">
          <ScrollableTableViewport>
            <Table className={settingsTableClassName}>
              <TableHeader className="sticky top-0 z-10 bg-card [&_tr]:border-b-0">
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead className="h-12 bg-card py-3 pl-10">Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={settingsTableBodyClassName}>
                {MAIL_TEMPLATES.map((mail) => (
                  <TableRow
                    key={mail.to}
                    className="cursor-pointer hover:bg-transparent"
                    onClick={() => navigate({ to: mail.to })}
                  >
                    <TableCell className="whitespace-normal">
                      <p className="typo-body-sm text-text-primary">{mail.name}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollableTableViewport>
        </CardContent>
      </Card>
    </section>
  );
}
