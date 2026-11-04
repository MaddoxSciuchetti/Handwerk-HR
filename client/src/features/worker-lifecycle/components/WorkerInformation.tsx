import LoadingAlert from '@/components/alerts/LoadingAlert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
  workerEngagementInfoItems,
  type WorkerEngagementInfoItem,
} from '../consts/worker-engagement-info.consts';
import { workerLifecycleQueries } from '../query-options/queries/worker-lifycycle.queries';
import type { WorkerDetailResponse } from '../types/index.types';
import WorkerEmailField from './WorkerEmailField';
import WorkerInfoField from './WorkerInfoField';
import WorkerClothingPanel from './WorkerClothingPanel';

function InfoFieldRow({
  workerId,
  item,
}: {
  workerId: string;
  item: WorkerEngagementInfoItem;
}) {
  if (item.editable === 'email') {
    return <WorkerEmailField workerId={workerId} email={item.value} />;
  }
  if (item.editable) {
    return <WorkerInfoField workerId={workerId} item={item} />;
  }
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-start gap-4 border-b border-border/50 py-3.5 last:border-b-0">
      <span className="text-sm text-muted-foreground">{item.label}</span>
      <span className="min-w-0 text-right text-sm break-words text-foreground">
        {item.value}
      </span>
    </div>
  );
}

function InfoFieldColumn({
  workerId,
  items,
}: {
  workerId: string;
  items: WorkerEngagementInfoItem[];
}) {
  return (
    <div className="min-w-0">
      {items.map((item) => (
        <InfoFieldRow key={item.label} workerId={workerId} item={item} />
      ))}
    </div>
  );
}

function splitInfoColumns(items: WorkerEngagementInfoItem[]) {
  const mid = Math.ceil(items.length / 2);
  return {
    left: items.slice(0, mid),
    right: items.slice(mid),
  };
}

export function WorkerInformationFields({
  workerId,
  worker,
}: {
  workerId: string;
  worker: WorkerDetailResponse['data'];
}) {
  const items = workerEngagementInfoItems(worker);
  const { left, right } = splitInfoColumns(items);

  return (
    <div className="flex w-full flex-col text-left">
      <article className="rounded-2xl border border-border/60">
        <Accordion type="single" collapsible defaultValue="information">
          <AccordionItem value="information" className="border-0">
            <AccordionTrigger
              className={cn(
                'items-center px-4 py-3 hover:no-underline',
                '**:data-[slot=accordion-trigger-icon]:ml-2 **:data-[slot=accordion-trigger-icon]:size-4'
              )}
            >
              Informationen
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid gap-x-10 md:grid-cols-2">
                <InfoFieldColumn workerId={workerId} items={left} />
                <InfoFieldColumn workerId={workerId} items={right} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </article>
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
