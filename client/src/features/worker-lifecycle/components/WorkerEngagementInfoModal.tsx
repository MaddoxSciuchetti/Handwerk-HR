import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { workerEngagementInfoItems } from '../consts/worker-engagement-info.consts';
import { workerLifecycleQueries } from '../query-options/queries/worker-lifycycle.queries';
import WorkerInfoHeader from './WorkerInfoHeader';

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

  if (!isOpen) return null;

  const items = data?.data ? workerEngagementInfoItems(data.data) : [];

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <Dialog open onOpenChange={(next) => { if (!next) onClose(); }}>
        <DialogContent className="h-auto min-h-80 rounded-lg p-4 text-center sm:max-w-2xl">
          <div className="flex w-full flex-col p-8 text-left">
            <WorkerInfoHeader isError={isError} />
            {isLoading ? (
              <div className="flex min-h-60 w-full items-center justify-center">
                <LoadingAlert className="min-h-0" />
              </div>
            ) : (
              <div className="w-full">
                {items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4 border-b border-border/50 py-3.5 last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">
                      {item.label}
                    </span>
                    <span className="text-sm text-foreground">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WorkerEngagementInfoModal;
