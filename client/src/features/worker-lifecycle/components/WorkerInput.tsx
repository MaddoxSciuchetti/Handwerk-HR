import { workerMutations } from '@/features/task-management/query-options/mutations/worker.mutations';
import { DescriptionFieldResponse } from '@/types/api.types';
import { useMutation } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { Dispatch, MouseEvent, SetStateAction, useState } from 'react';
import { WorkerInfoItem } from '../consts/worker-info.consts';
import {
  addWorkerBaseSchema,
  OffboardingValidation,
} from '../schemas/zod.schemas';

type WorkerInputProps = {
  item: WorkerInfoItem;
  idx: number;
  workerInfo: DescriptionFieldResponse | undefined;
  workerId: number;
  inputState: boolean | undefined;
  setInputState: Dispatch<SetStateAction<boolean | undefined>>;
};

const WorkerInput = ({
  item,
  idx,
  workerInfo,
  workerId,
  inputState,
  setInputState,
}: WorkerInputProps) => {
  const [uniqueInput, setUniqueInput] = useState<number>();
  const [inputValue, setInputValue] = useState<string>();
  const { mutate } = useMutation(workerMutations.updateDataPoint(workerId));

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
  return (
    <>
      {uniqueInput === idx && inputState && item.form ? (
        <span className="flex">
          <input
            placeholder={`${item.value}`}
            onChange={(e) => setInputValue(e.target.value)}
            onClick={(e: MouseEvent<HTMLInputElement>) => e.stopPropagation()}
          />
          <X
            className="cursor-pointer hover:text-(--destructive) "
            onClick={() => setInputState(false)}
          />
          <Check
            className="cursor-pointer hover:text-(--chart-2)"
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
  );
};

export default WorkerInput;
