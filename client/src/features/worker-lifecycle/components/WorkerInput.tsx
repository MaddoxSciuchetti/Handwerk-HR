import { workerMutations } from '@/features/task-management/query-options/mutations/worker.mutations';
import { UpdatePayload } from '@/features/task-management/types/index.types';
import { DescriptionFieldResponse } from '@/types/api.types';
import { useMutation } from '@tanstack/react-query';
import { Dispatch, SetStateAction, useState } from 'react';
import { WorkerInfoItem } from '../consts/worker-info.consts';
import {
  addWorkerBaseSchema,
  OffboardingValidation,
} from '../schemas/zod.schemas';
import ActiveField from './ActiveField';
import NonActiveField from './NonActiveField';

type WorkerInputProps = {
  item: WorkerInfoItem;
  idx: number;
  workerInfo: DescriptionFieldResponse | undefined;
  workerId: number;
  inputState: boolean | undefined;
  setInputState: Dispatch<SetStateAction<boolean | undefined>>;
  uniqueInput: number | undefined;
  setUniqueInput: Dispatch<SetStateAction<number | undefined>>;
};

const WorkerInput = ({
  item,
  idx,
  workerInfo,
  workerId,
  inputState,
  setInputState,
  uniqueInput,
  setUniqueInput,
}: WorkerInputProps) => {
  const [inputValue, setInputValue] = useState<string>();
  const { mutate, isPending, variables } = useMutation(
    workerMutations.updateDataPoint(workerId)
  );

  const handleSubmit = (item: WorkerInfoItem) => {
    if (!workerInfo || !inputValue) return;
    const key = item.schemaKey!;
    const schema =
      key === 'austrittsdatum'
        ? OffboardingValidation.pick({ [key]: true } as Record<
            'austrittsdatum',
            true
          >)
        : addWorkerBaseSchema.pick({ [key]: true } as Record<typeof key, true>);

    const result = schema.safeParse({ [item.schemaKey!]: inputValue });
    if (!result.success) {
      console.log(result.error);
      return;
    }
    mutate(result.data);
  };

  return (
    <div className="w-96 shrink-0">
      {uniqueInput === idx && inputState && item.form ? (
        <ActiveField
          inputValue={inputValue}
          setInputState={setInputState}
          setInputValue={setInputValue}
          handleSubmit={handleSubmit}
          item={item}
          variables={variables as UpdatePayload}
          isPending={isPending}
        />
      ) : (
        <NonActiveField
          item={item}
          setInputState={setInputState}
          setUniqueInput={setUniqueInput}
          setInputValue={setInputValue}
          isPending={isPending}
          variables={variables as UpdatePayload}
          idx={idx}
        />
      )}
    </div>
  );
};

export default WorkerInput;
