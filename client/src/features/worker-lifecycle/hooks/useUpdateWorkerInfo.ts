import { workerMutations } from '@/features/task-management/query-options/mutations/worker.mutations';
import { UpdatePayload } from '@/features/task-management/types/index.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { WorkerInfoItem } from '../consts/worker-info.consts';
import { getWorkerFieldSchema } from '../utils/workerInputValidation';

function useUpdateWorkerInfo(workerInfo: WorkerInfoItem, workerId: string) {
  const key = workerInfo.schemaKey;
  const schema = key ? getWorkerFieldSchema(key) : undefined;
  const [inputValue, setInputValue] = useState<string>();

  const {
    handleSubmit: handleFormSubmit,
    formState: { errors },
    setValue,
  } = useForm<Record<string, unknown>>({
    resolver: schema ? zodResolver(schema) : undefined,
    mode: 'onChange',
  });

  const { mutate, isPending, variables } = useMutation(
    workerMutations.updateDataPoint(workerId)
  );

  const handleSubmit = () => {
    if (!key) return;
    handleFormSubmit((data) => {
      mutate(data as UpdatePayload);
    })();
  };

  const handleInputChange = (value: string) => {
    if (!key) return;
    setInputValue(value);
    setValue(key, value, { shouldValidate: true, shouldDirty: true });
  };

  const errorMessage = key ? errors[key]?.message : undefined;

  return {
    key,
    schema,
    handleFormSubmit,
    handleInputChange,
    errors,
    setValue,
    setInputValue,
    mutate,
    isPending,
    variables,
    inputValue,
    errorMessage,
    handleSubmit,
  };
}

export default useUpdateWorkerInfo;
