import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LifecycleType } from '@/features/task-management/types/index.types';
import { useState } from 'react';
import useWorkerInfo from '../hooks/useWorkerInfo';
import WorkerInfoHeader from './WorkerInfoHeader';
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

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="h-auto min-h-120 rounded-lg p-4 text-center sm:max-w-2xl">
        <div
          className="flex w-full flex-col gap-3 p-8 text-left"
          onClick={() => setIsInputActive(false)}
        >
          <WorkerInfoHeader isError={isError} />
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
      </DialogContent>
    </Dialog>
  );
};

export default WorkerInfoModal;
