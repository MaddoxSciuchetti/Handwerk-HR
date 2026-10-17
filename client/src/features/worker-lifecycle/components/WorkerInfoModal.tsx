import LoadingAlert from '@/components/alerts/LoadingAlert';
import { LifecycleType } from '@/features/task-management/types/index.types';
import { useState } from 'react';
import useWorkerInfo from '../hooks/useWorkerInfo';
import WorkerInfoPanel from './WorkerInfoPanel';
import WorkerInfos from './WorkerInfos';

type WorkerInfoModalProps = {
  isOpen: boolean;
  workerId: number;
  lifecycleType: LifecycleType;
  onClose: () => void;
};

const WorkerInfoModal = ({
  isOpen,
  workerId,
  lifecycleType,
  onClose,
}: WorkerInfoModalProps) => {
  const { isError, isLoading, workerInfo } = useWorkerInfo(
    isOpen,
    workerId,
    lifecycleType
  );

  const [isInputActive, setIsInputActive] = useState<boolean>();
  const [uniqueInput, setUniqueInput] = useState<number>();

  return (
    <WorkerInfoPanel isOpen={isOpen} isError={isError} onClose={onClose}>
      <div
        className="flex w-full flex-col gap-3 text-left"
        onClick={() => setIsInputActive(false)}
      >
        {isLoading ? (
          <div className="flex w-full min-h-104 items-center justify-center">
            <LoadingAlert className="min-h-0" />
          </div>
        ) : workerInfo ? (
          <WorkerInfos
            workerId={workerId}
            workerInfo={workerInfo}
            lifecycleType={lifecycleType}
            isInputActive={isInputActive}
            setIsInputActive={setIsInputActive}
            uniqueInput={uniqueInput}
            setUniqueInput={setUniqueInput}
          />
        ) : null}
      </div>
    </WorkerInfoPanel>
  );
};

export default WorkerInfoModal;
