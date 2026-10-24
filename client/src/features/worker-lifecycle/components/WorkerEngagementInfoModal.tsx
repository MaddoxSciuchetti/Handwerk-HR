import LoadingAlert from '@/components/alerts/LoadingAlert';
import { useQuery } from '@tanstack/react-query';
import { workerLifecycleQueries } from '../query-options/queries/worker-lifycycle.queries';
import WorkerInfoPanel from './WorkerInfoPanel';
import { WorkerInformationFields } from './WorkerInformation';

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

  return (
    <WorkerInfoPanel isOpen={isOpen} isError={isError} onClose={onClose}>
      <div className="flex w-full flex-col text-left">
        {isLoading ? (
          <div className="flex min-h-60 w-full items-center justify-center">
            <LoadingAlert className="min-h-0" />
          </div>
        ) : data?.data ? (
          <WorkerInformationFields workerId={workerId} worker={data.data} />
        ) : null}
      </div>
    </WorkerInfoPanel>
  );
}

export default WorkerEngagementInfoModal;
