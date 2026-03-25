import { workerMutations } from '@/features/task-management/query-options/mutations/worker.mutations';
import { UpdatePayload } from '@/features/task-management/types/index.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Dispatch, SetStateAction } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { WorkerInfoItem } from '../consts/worker-info.consts';
import { getWorkerFieldSchema } from '../utils/workerInputValidation';
import ActiveField from './ActiveField';
import NonActiveField from './NonActiveField';

type WorkerInputProps = {
  item: WorkerInfoItem;
  idx: number;
  workerId: number;
  isInputActive: boolean | undefined;
  setIsInputActive: Dispatch<SetStateAction<boolean | undefined>>;
  uniqueInput: number | undefined;
  setUniqueInput: Dispatch<SetStateAction<number | undefined>>;
};

const WorkerInput = ({
  item,
  idx,
  workerId,
  isInputActive,
  setIsInputActive,
  uniqueInput,
  setUniqueInput,
}: WorkerInputProps) => {
  const key = item.schemaKey;
  const schema = key ? getWorkerFieldSchema(key) : undefined;

  const {
    handleSubmit: handleFormSubmit,
    formState: { errors },
    setValue,
    control,
  } = useForm<Record<string, unknown>>({
    resolver: schema ? zodResolver(schema) : undefined,
    mode: 'onChange',
  });

  const { mutate, isPending, variables } = useMutation(
    workerMutations.updateDataPoint(workerId)
  );

  const inputValue = useWatch({
    control,
    name: (key ?? 'unused') as string,
  }) as string | undefined;

  const handleInputChange = (value: string) => {
    if (!key) return;

    setValue(key, value, { shouldValidate: true, shouldDirty: true });
  };

  const errorMessage = key
    ? (errors[key]?.message as string | undefined)
    : undefined;

  return (
    <div className="w-full">
      {uniqueInput === idx && isInputActive && item.form ? (
        <ActiveField
          inputValue={inputValue}
          setIsInputActive={setIsInputActive}
          setInputValue={handleInputChange}
          handleSubmit={() => {
            if (!key) return;

            handleFormSubmit((data) => {
              mutate(data as UpdatePayload);
            })();
          }}
          item={item}
          variables={variables as UpdatePayload}
        />
      ) : (
        <NonActiveField
          item={item}
          setIsInputActive={setIsInputActive}
          setUniqueInput={setUniqueInput}
          setInputValue={handleInputChange}
          isPending={isPending}
          variables={variables as UpdatePayload}
          idx={idx}
        />
      )}
      {errorMessage && (
        <span className="mt-1 block text-(--destructive)">{errorMessage}</span>
      )}
    </div>
  );
};

export default WorkerInput;
