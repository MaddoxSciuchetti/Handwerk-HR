import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getFirstFormType } from '@/lib/formtype';
import { OffboardingItem } from '../types/index.types';
import { Worker_Item } from './WorkerItem';

type LifeCycleTableProps = {
  filtered: OffboardingItem[] | undefined;
  item_value?: number;
  onRemove: (taskId: number) => void;
  gotopage: (taskId: number, form_type: any) => void;
};

function LifeCycleTable({ filtered, onRemove, gotopage }: LifeCycleTableProps) {
  return (
    <>
      <div className="rounded-2xl overflow-x-auto w-full h-full  overflow-auto">
        <div className=" w-full flex flex-col">
          <Table className=" text-left mt-5">
            <TableHeader className="">
              <TableRow className="text-lg">
                <TableHead className="text-left  pl-0">Handwerker</TableHead>
                <TableHead className="text-left  pl-0">Phase</TableHead>
                <TableHead className=" pl-0">Fortschritt</TableHead>
                <TableHead className=" pl-0">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((task: OffboardingItem) => (
                <Worker_Item
                  key={task.id}
                  item_value={task.id}
                  form_type={getFirstFormType(task)}
                  item={task.vorname}
                  item1={task.nachname}
                  onRemove={onRemove}
                  gotopage={gotopage}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

export default LifeCycleTable;
