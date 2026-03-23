import ModalOverlay from '@/components/modal/ModalOverlay';
import MediumWrapper from '@/components/modal/modalSizes/MediumWrapper';
import { workerMutations } from '@/features/task-management/query-options/mutations/worker.mutations';
import { useMutation } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { MouseEvent, useState } from 'react';
import { WorkerInfoItem, workerInfos } from '../consts/worker-info.consts';
import useWorkerInfo from '../hooks/useWorkerInfo';
import {
  addWorkerBaseSchema,
  OffboardingValidation,
} from '../schemas/zod.schemas';
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
  const { mutate } = useMutation(workerMutations.updateDataPoint(workerId));

  const [uniqueInput, setUniqueInput] = useState<number>();
  const [inputState, setInputState] = useState<boolean>();
  const [inputValue, setInputValue] = useState<string>();

  const handleSubmit = (item: WorkerInfoItem) => {
    if (!workerInfo || !inputValue) return;
    const schema =
      item.schemaKey === 'austrittsdatum'
        ? OffboardingValidation.pick({ [item.schemaKey]: true } as any)
        : addWorkerBaseSchema.pick({ [item.schemaKey!]: true } as any);

    const result = schema.safeParse({ [item.schemaKey!]: inputValue });
    if (!result.success) {
      console.log(result.error);
      return;
    }
    mutate(result.data);
  };

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
                  <span
                    key={`${item.label}-label`}
                    className={item.className ?? 'text-muted-foreground'}
                  >
                    {item.label}
                  </span>
                  {uniqueInput === idx && inputState && item.form ? (
                    <span className="flex">
                      <input
                        placeholder={`${item.value}`}
                        onChange={(e) => setInputValue(e.target.value)}
                        className=""
                        onClick={(e: MouseEvent<HTMLInputElement>) =>
                          e.stopPropagation()
                        }
                      />
                      <X
                        className="cursor-pointer"
                        onClick={() => setInputState(false)}
                      />
                      <Check
                        className="cursor-pointer"
                        onClick={() => handleSubmit(item)}
                      />
                    </span>
                  ) : (
                    <span
                      className="truncate"
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
      </MediumWrapper>
    </ModalOverlay>
  );
};

export default WorkerInfoModal;
