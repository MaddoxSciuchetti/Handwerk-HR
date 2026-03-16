import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getFirstFormType } from '@/features/worker-lifecycle/utils/formtype';
import { UseMutateFunction } from '@tanstack/react-query';
import {
  DeleteUser,
  FormType,
  ItemUser,
  WorkerItem,
  WorkerListMode,
} from '../types/index.types';
import { Worker_Item } from './WorkerItem';

type LifeCycleTableProps = {
  filtered: WorkerItem[] | undefined;
  item_value?: number;
  onRemove: UseMutateFunction<DeleteUser, Error, number, unknown>;
  onArchive: UseMutateFunction<ItemUser, Error, number, unknown>;
  onUnarchive: UseMutateFunction<ItemUser, Error, number, unknown>;
  mode: WorkerListMode;
  gotopage: (taskId: number, form_type: FormType, workerName: string) => void;
};

function LifeCycleTable({
  filtered,
  onRemove,
  onArchive,
  onUnarchive,
  mode,
  gotopage,
}: LifeCycleTableProps) {
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
                    item={task.vorname}
                    item1={task.nachname}
                    onRemove={onRemove}
                    onArchive={onArchive}
                    onUnarchive={onUnarchive}
                    mode={mode}
                    gotopage={gotopage}
                  />
                ))
              ) : (
                <TableRow>
                  <td
                    colSpan={4}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {mode === 'archived'
                      ? 'Es gibt aktuell keine archivierten Handwerker.'
                      : 'Keine Handwerker gefunden.'}
                  </td>
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
