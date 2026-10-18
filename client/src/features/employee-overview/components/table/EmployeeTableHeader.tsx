import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

const EmployeeTableHeader = () => {
  return (
    <TableHeader className="text-left [&_tr]:border-b-0">
      <TableRow className="border-0 hover:bg-transparent">
        <TableHead scope="col" className="h-12 py-3 pl-10">
          Meine Mitarbeiter
        </TableHead>
        <TableHead scope="col" className="py-3 px-2">
          Offene Aufgaben
        </TableHead>
        <TableHead scope="col" className="py-3 px-2">
          Status
        </TableHead>
        <TableHead scope="col" className="py-3 px-2">
          Vertretung
        </TableHead>
        <TableHead scope="col" className="py-3 px-2">
          Aktionen
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default EmployeeTableHeader;
