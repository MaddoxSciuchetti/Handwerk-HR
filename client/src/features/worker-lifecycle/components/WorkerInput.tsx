import { UpdatePayload } from '@/features/task-management/types/index.types';
import { Dispatch, SetStateAction } from 'react';
import { WorkerInfoItem } from '../consts/worker-info.consts';
import useUpdateWorkerInfo from '../hooks/useUpdateWorkerInfo';
import ActiveField from './ActiveField';
import NonActiveField from './NonActiveField';

type WorkerInputProps = {
  workerInfo: WorkerInfoItem;
  idx: number;
  workerId: string;
  isInputActive: boolean | undefined;
  setIsInputActive: Dispatch<SetStateAction<boolean | undefined>>;
  uniqueInput: number | undefined;
  setUniqueInput: Dispatch<SetStateAction<number | undefined>>;
};

const WorkerInput = ({
  workerInfo,
  idx,
  workerId,
  isInputActive,
  setIsInputActive,
  uniqueInput,
  setUniqueInput,
}: WorkerInputProps) => {
  const {
    handleSubmit,
    errorMessage,
    isPending,
    variables,
    inputValue,
    handleInputChange,
  } = useUpdateWorkerInfo(workerInfo, workerId);

  return (
    <div className="w-full">
      {uniqueInput === idx && isInputActive && workerInfo.form ? (
        <ActiveField
          inputValue={inputValue}
          setIsInputActive={setIsInputActive}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
        />
      ) : (
        <NonActiveField
          workerInfo={workerInfo}
          setIsInputActive={setIsInputActive}
          setUniqueInput={setUniqueInput}
          handleInputChange={handleInputChange}
          isPending={isPending}
          variables={variables as UpdatePayload}
          idx={idx}
        />
      )}
      {errorMessage && (
        <span className="mt-1 block text-[var(--destructive)]">{errorMessage}</span>
      )}
    </div>
  );
};

export default WorkerInput;
