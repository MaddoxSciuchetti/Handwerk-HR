import { UpdatePayload } from '@/features/task-management/types/index.types';
import { Dispatch, SetStateAction } from 'react';
import { WorkerInfoItem } from '../consts/worker-info.consts';
import useUpdateWorkerInfo from '../hooks/useUpdateWorkerInfo';
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
  const {
    key,
    handleFormSubmit,
    errorMessage,
    setValue,
    mutate,
    isPending,
    variables,
    inputValue,
    setInputValue,
  } = useUpdateWorkerInfo(item, workerId);

  const handleInputChange = (value: string) => {
    if (!key) return;
    setInputValue(value);
    setValue(key, value, { shouldValidate: true, shouldDirty: true });
  };
  const handleSubmit = () => {
    if (!key) return;
    handleFormSubmit((data) => {
      mutate(data as UpdatePayload);
    })();
  };

  return (
    <div className="w-full">
      {uniqueInput === idx && isInputActive && item.form ? (
        <ActiveField
          inputValue={inputValue}
          setIsInputActive={setIsInputActive}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          item={item}
          variables={variables as UpdatePayload}
        />
      ) : (
        <NonActiveField
          item={item}
          setIsInputActive={setIsInputActive}
          setUniqueInput={setUniqueInput}
          handleInputChange={handleInputChange}
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
