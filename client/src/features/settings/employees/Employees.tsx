import { Button } from '@/components/ui/selfmade/button';
import { Input } from '@/components/ui/selfmade/input';
import {
  Cell,
  CellHolder,
  GrowingItem,
  ItemHeader,
  Table,
  TableDivider,
  TableHeader,
} from '@/components/ui/selfmade/table/Table';
import { useSendInvite } from '../hooks/useSendInvite';
import { SettingsHeader } from './SettingsHeader';

function Employees() {
  const { isPending, handleSendInvite, mitarbeiterEmail, setMitarbeiterEmail } =
    useSendInvite();
  return (
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 md:max-w-8xl">
      <div className="h-full w-full flex flex-col items-center justify-center">
        <SettingsHeader />
        <Table className="w-200 ">
          <TableHeader className=" py-2">
            <Button
              className="text-sm"
              disabled={isPending}
              onClick={handleSendInvite}
            >
              {isPending ? 'Sende...' : 'Hinzufügen'}
            </Button>
            <Input
              placeholder="Mitarbeite Email"
              value={mitarbeiterEmail}
              onChange={(e) => setMitarbeiterEmail(e.target.value)}
            />
          </TableHeader>
          <TableDivider />
          <ItemHeader className="p-0">
            <GrowingItem className="pl-10 py-2">
              <p className="typo-body-sm">Name</p>
            </GrowingItem>
            <CellHolder>
              <Cell className="typo-body-sm">Offene Aufgaben</Cell>
              <Cell className="typo-body-sm">Status</Cell>
              <Cell className="typo-body-sm">Vertretung</Cell>
              <Cell className="typo-body-sm">Aktionen</Cell>
            </CellHolder>
          </ItemHeader>
        </Table>
      </div>
    </div>
  );
}

export default Employees;
