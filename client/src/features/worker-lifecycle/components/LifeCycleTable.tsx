import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { LifecycleType } from '@/features/task-management/types/index.types';
import { getFirstFormType } from '@/features/worker-lifecycle/utils/formtype';
import { WorkerItem, WorkerListMode } from '../types/index.types';
import { Worker_Item } from './WorkerItem';

type LifeCycleTableProps = {
  filtered: WorkerItem[] | undefined;
  mode: WorkerListMode;
  gotopage: (
    taskId: number,
    form_type: LifecycleType,
    workerName: string
  ) => void;
};

function LifeCycleTable({ filtered, mode, gotopage }: LifeCycleTableProps) {
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
              {filtered?.length ? (
                filtered.map((task: WorkerItem) => (
                  <Worker_Item
                    key={task.id}
                    item_value={task.id}
                    form_type={getFirstFormType(task)}
                    vorname={task.vorname}
                    nachname={task.nachname}
                    mode={mode}
                    gotopage={gotopage}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {mode === 'archived'
                      ? 'Es gibt aktuell keine archivierten Handwerker.'
                      : 'Keine Handwerker gefunden.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

export default LifeCycleTable;
