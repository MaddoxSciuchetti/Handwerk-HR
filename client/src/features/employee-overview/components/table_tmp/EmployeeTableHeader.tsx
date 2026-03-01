import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

type EmployeeTableHeaderProps = {};

const EmployeeTableHeader = ({}: EmployeeTableHeaderProps) => {
  return (
    <>
      <TableHeader className="">
        <TableRow className="text-lg">
          <TableHead className="text-left  pl-0">Meine Mitarbeiter</TableHead>
          <TableHead className="text-left">Status</TableHead>
          <TableHead>Vertetung</TableHead>
          <TableHead className=" pl-0">Aktionen</TableHead>
        </TableRow>
      </TableHeader>
    </>
  );
};

export default EmployeeTableHeader;
