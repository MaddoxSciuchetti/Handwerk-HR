import ModalOverlay from '@/components/modal/ModalOverlay';
import MediumWrapper from '@/components/modal/modalSizes/MediumWrapper';
import { useState } from 'react';
import { workerInfos } from '../consts/worker-info.consts';
import useWorkerInfo from '../hooks/useWorkerInfo';
import { FormType } from '../types/index.types';
import WorkerDescription from './WorkerDescription';
import WorkerInfoHeader from './WorkerInfoHeader';
import WorkerInput from './WorkerInput';

type WorkerInfoModalProps = {
  isOpen: boolean;
  workerId: number;
  lifecycleType: FormType;
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

  const [inputState, setInputState] = useState<boolean>();

  if (!isOpen) {
    return null;
  }

  return (
    <ModalOverlay size={'max-w-2xl'} handleToggle={onClose}>
      <MediumWrapper>
        <div
          className="flex w-full flex-col gap-3 text-left"
          onClick={() => setInputState(false)}
        >
          <WorkerInfoHeader isLoading={isLoading} isError={isError} />
          {workerInfo ? (
            <div className="grid grid-cols-2 gap-2 text-md ">
              {workerInfos(workerInfo).map((item, idx) => (
                <>
                  <WorkerDescription item={item} />
                  <WorkerInput
                    item={item}
                    idx={idx}
                    workerInfo={workerInfo}
                    workerId={workerId}
                    inputState={inputState}
                    setInputState={setInputState}
                  />
                </>
              ))}
            </div>
          ) : null}
        </div>
      </MediumWrapper>
    </ModalOverlay>
  );
};

export default WorkerInfoModal;
