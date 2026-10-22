import LoadingAlert from '@/components/alerts/LoadingAlert';
import { useQuery } from '@tanstack/react-query';
import { workerEngagementInfoItems } from '../consts/worker-engagement-info.consts';
import { workerLifecycleQueries } from '../query-options/queries/worker-lifycycle.queries';
import WorkerEmailField from './WorkerEmailField';
import WorkerInfoPanel from './WorkerInfoPanel';

type WorkerEngagementInfoModalProps = {
  isOpen: boolean;
  workerId: string;
  onClose: () => void;
};

function WorkerEngagementInfoModal({
  isOpen,
  workerId,
  onClose,
}: WorkerEngagementInfoModalProps) {
  const { data, isLoading, isError } = useQuery({
    ...workerLifecycleQueries.workerById(workerId),
    enabled: isOpen,
  });

  const items = data?.data ? workerEngagementInfoItems(data.data) : [];

  return (
    <WorkerInfoPanel isOpen={isOpen} isError={isError} onClose={onClose}>
      <div className="flex w-full flex-col text-left">
        {isLoading ? (
          <div className="flex min-h-60 w-full items-center justify-center">
            <LoadingAlert className="min-h-0" />
          </div>
        ) : (
          <div className="w-full">
            {items.map((item) =>
              item.editable === 'email' ? (
                <WorkerEmailField
                  key={item.label}
                  workerId={workerId}
                  email={item.value}
                />
              ) : (
                <div
                  key={item.label}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-start gap-4 border-b border-border/50 py-3.5 last:border-0"
                >
                  <span className="text-sm text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="min-w-0 text-right text-sm break-words text-foreground">
                    {item.value}
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </WorkerInfoPanel>
  );
}

export default WorkerEngagementInfoModal;
