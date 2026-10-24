import LoadingAlert from '@/components/alerts/LoadingAlert';
import { useQuery } from '@tanstack/react-query';
import { workerEngagementInfoItems } from '../consts/worker-engagement-info.consts';
import { workerLifecycleQueries } from '../query-options/queries/worker-lifycycle.queries';
import type { WorkerDetailResponse } from '../types/index.types';
import WorkerEmailField from './WorkerEmailField';
import WorkerInfoField from './WorkerInfoField';
import WorkerClothingPanel from './WorkerClothingPanel';

export function WorkerInformationFields({
  workerId,
  worker,
}: {
  workerId: string;
  worker: WorkerDetailResponse['data'];
}) {
  const items = workerEngagementInfoItems(worker);
  return (
    <div className="flex w-full flex-col text-left">
      {items.map((item) =>
        item.editable === 'email' || item.editable === 'workEmail' ? (
          <WorkerEmailField
            key={item.label}
            workerId={workerId}
            email={item.value}
            field={item.editable}
          />
        ) : item.editable ? (
          <WorkerInfoField key={item.label} workerId={workerId} item={item} />
        ) : (
          <div
            key={item.label}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-start gap-4 border-b border-border/50 py-3.5"
          >
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className="min-w-0 text-right text-sm break-words text-foreground">
              {item.value}
            </span>
          </div>
        )
      )}
      <WorkerClothingPanel
        workerId={workerId}
        engagements={worker.engagements}
      />
    </div>
  );
}

export default function WorkerInformation({ workerId }: { workerId: string }) {
  const { data, isLoading, isError } = useQuery(
    workerLifecycleQueries.workerById(workerId)
  );
  if (isLoading) return <LoadingAlert className="min-h-60" />;
  if (isError || !data?.data)
    return (
      <p role="alert" className="py-4 text-sm text-destructive">
        Informationen konnten nicht geladen werden.
      </p>
    );
  return <WorkerInformationFields workerId={workerId} worker={data.data} />;
}
