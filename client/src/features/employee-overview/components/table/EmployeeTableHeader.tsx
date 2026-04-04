import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

const EmployeeTableHeader = () => {
  return (
    <TableHeader className="text-left mb-5">
      <TableRow className="text-lg">
        <TableHead scope="col" className="text-left  pl-0">
          
        </TableHead>
        <TableHead scope="col" className="text-left  pl-0">
          Offene Aufgaben
        </TableHead>
        <TableHead scope="col" className="text-left pl-0">
          Status
        </TableHead>
        <TableHead scope="col" className="pl-0">
          Vertretung
        </TableHead>
        <TableHead scope="col" className=" pl-0">
          Aktionen
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default EmployeeTableHeader;
