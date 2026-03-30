import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import MediumWrapper from '@/components/modal/modalSizes/MediumWrapper';
import { useState } from 'react';
import useWorkerInfo from '../hooks/useWorkerInfo';
import WorkerInfoHeader from './WorkerInfoHeader';
import WorkerInfos from './WorkerInfos';

type WorkerInfoModalProps = {
  isOpen: boolean;
  workerId: string;
  onClose: () => void;
};

const WorkerInfoModal = ({
  isOpen,
  workerId,
  onClose,
}: WorkerInfoModalProps) => {
  const { isError, isLoading, workerInfo } = useWorkerInfo(
    isOpen,
    workerId,
  );

  const [isInputActive, setIsInputActive] = useState<boolean>();
  const [uniqueInput, setUniqueInput] = useState<number>();

  if (!isOpen) {
    return null;
  }

  return (
    <ModalOverlay size={'max-w-2xl'} handleToggle={onClose}>
      <MediumWrapper width="w-full max-w-2xl" height="h-auto min-h-120">
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
              isInputActive={isInputActive}
              setIsInputActive={setIsInputActive}
              uniqueInput={uniqueInput}
              setUniqueInput={setUniqueInput}
            />
          ) : null}
        </div>
      </MediumWrapper>
    </ModalOverlay>
  );
};

export default WorkerInfoModal;
