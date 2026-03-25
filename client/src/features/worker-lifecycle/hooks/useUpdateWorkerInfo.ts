import { workerMutations } from '@/features/task-management/query-options/mutations/worker.mutations';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { WorkerInfoItem } from '../consts/worker-info.consts';
import { getWorkerFieldSchema } from '../utils/workerInputValidation';

function useUpdateWorkerInfo(item: WorkerInfoItem, workerId: number) {
  const key = item.schemaKey;
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

  const errorMessage = key ? errors[key]?.message : undefined;

  return {
    key,
    schema,
    handleFormSubmit,
    errors,
    setValue,
    setInputValue,
    mutate,
    isPending,
    variables,
    inputValue,
    errorMessage,
  };
}

export default useUpdateWorkerInfo;
