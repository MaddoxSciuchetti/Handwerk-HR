import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { LifecycleType } from '@/features/task-management/types/index.types';
import { EngagementStatus, WorkerRecord } from '../types/index.types';
import { Worker_Item } from './WorkerItem';

type LifeCycleTableProps = {
  error: Error | null;
  filtered: WorkerRecord[] | undefined;
  engagementStatus: EngagementStatus;
  gotopage: (
    taskId: string,
    form_type: LifecycleType,
    workerName: string
  ) => void;
};

function LifeCycleTable({
  filtered,
  engagementStatus,
  gotopage,
}: LifeCycleTableProps) {
  return (
    <>
      <div className="h-full w-full overflow-auto overflow-x-auto rounded-2xl">
        <div className="flex w-full flex-col">
          <Table className="mt-5">
            <TableHeader>
              <TableRow className="text-lg">
                <TableHead className="text-center">Handwerker</TableHead>
                <TableHead className="min-w-[12rem] text-center">
                  Team & Projekt
                </TableHead>
                <TableHead className="text-center">Phase</TableHead>
                <TableHead className="text-center">Fortschritt</TableHead>
                <TableHead className="text-center">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.length ? (
                filtered.map((worker: WorkerRecord) => (
                  <Worker_Item
                    key={worker.id}
                    worker={worker}
                    engagementStatus={engagementStatus}
                    gotopage={gotopage}
                  />
                ))
              ) : (
                <TableRow>
                  <td
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {engagementStatus === 'archived'
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
