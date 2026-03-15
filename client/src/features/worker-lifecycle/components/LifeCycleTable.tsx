import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getFirstFormType } from '@/features/worker-lifecycle/utils/formtype';
import { UseMutateFunction } from '@tanstack/react-query';
import { DeleteUser, FormType, WorkerItem } from '../types/index.types';
import { Worker_Item } from './WorkerItem';

type LifeCycleTableProps = {
  filtered: WorkerItem[] | undefined;
  item_value?: number;
  onRemove: UseMutateFunction<DeleteUser, Error, number, unknown>;
  gotopage: (taskId: number, form_type: FormType, workerName: string) => void;
};

function LifeCycleTable({ filtered, onRemove, gotopage }: LifeCycleTableProps) {
  return (
    <>
      <div className="rounded-2xl overflow-x-auto w-full h-full  overflow-auto">
        <div className="text-left w-full flex flex-col ">
          <Table className="text-left mt-5">
            <TableHeader className="text-left">
              <TableRow className="text-left text-lg">
                <TableHead className="text-left">Handwerker</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Fortschritt</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((task: WorkerItem) => (
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
