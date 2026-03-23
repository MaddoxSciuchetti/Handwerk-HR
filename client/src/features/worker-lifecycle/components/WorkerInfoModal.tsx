import ModalOverlay from '@/components/modal/ModalOverlay';
import SmallWrapper from '@/components/modal/modalSizes/SmallWrapper';
import { MouseEvent, useState } from 'react';
import { workerInfos } from '../consts/worker-info.consts';
import useWorkerInfo from '../hooks/useWorkerInfo';
import { FormType } from '../types/index.types';
import WorkerInfoHeader from './WorkerInfoHeader';

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

  const [uniqueInput, setUniqueInput] = useState<number>();
  const [inputState, setInputState] = useState<boolean>();
  const [inputValue, setInputValue] = useState<string>();

  if (!isOpen) {
    return null;
  }

  return (
    <ModalOverlay handleToggle={onClose}>
      <SmallWrapper className="h-auto min-h-0 max-h-none w-full max-w-md p-5">
        <div
          className="flex w-full flex-col gap-3 text-left"
          onClick={() => setInputState(false)}
        >
          <WorkerInfoHeader isLoading={isLoading} isError={isError} />
          {workerInfo ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {workerInfos(workerInfo).map((item, idx) => (
                <>
                  <span
                    key={`${item.label}-label`}
                    className={item.className ?? 'text-muted-foreground'}
                  >
                    {item.label}
                  </span>
                  {uniqueInput === idx && inputState ? (
                    <input
                      placeholder={`${item.value}`}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className=""
                      onClick={(e: MouseEvent<HTMLInputElement>) =>
                        e.stopPropagation()
                      }
                    />
                  ) : (
                    <span
                      key={`${item.label}-value`}
                      onClick={(e: MouseEvent<HTMLSpanElement>) => {
                        e.stopPropagation();
                        setInputState(true);
                        setUniqueInput(idx);
                      }}
                    >
                      {item.value ?? '-'}
                    </span>
                  )}
                </>
              ))}
            </div>
          ) : null}
        </div>
      </SmallWrapper>
    </ModalOverlay>
  );
};

export default WorkerInfoModal;
