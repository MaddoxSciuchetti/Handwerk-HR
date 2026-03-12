import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

const EmployeeTableHeader = () => {
  return (
    <>
      <TableHeader className="text-left mb-5">
        <TableRow className="text-lg">
          <TableHead className="text-left  pl-0">Meine Mitarbeiter</TableHead>
          <TableHead className="text-left  pl-0">Offene Aufgaben</TableHead>
          <TableHead className="text-left">Status</TableHead>
          <TableHead>Vertetung</TableHead>
          <TableHead className=" pl-0">Aktionen</TableHead>
        </TableRow>
      </TableHeader>
    </>
  );
};

export default EmployeeTableHeader;
