import { LifecycleType } from '@/features/task-management/types/index.types';
import { DescriptionFieldResponse } from '@/types/api.types';
import { Dispatch, SetStateAction } from 'react';
import { workerInfos } from '../consts/worker-info.consts';
import WorkerDescription from './WorkerDescription';
import WorkerInput from './WorkerInput';

type WorkerInfosProps = {
  workerInfo: DescriptionFieldResponse;
  lifecycleType: LifecycleType;
  workerId: number;
  isInputActive: boolean | undefined;
  setIsInputActive: Dispatch<SetStateAction<boolean | undefined>>;
  uniqueInput: number | undefined;
  setUniqueInput: Dispatch<SetStateAction<number | undefined>>;
};

const WorkerInfos = ({
  workerInfo,
  lifecycleType,
  workerId,
  isInputActive,
  setIsInputActive,
  uniqueInput,
  setUniqueInput,
}: WorkerInfosProps) => {
  const workers = workerInfos(workerInfo).filter(
    (value) =>
      !(lifecycleType === 'Onboarding' && value.schemaKey === 'austrittsdatum')
  );
  return (
    <>
      <div className="w-full">
        {workers.map((workerInfo, idx) => (
          <div key={`${workerInfo.label}-${idx}`}>
            <div className="group grid grid-cols-1 items-center gap-2 py-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-4">
              <WorkerDescription workerInfo={workerInfo} />
              <div className="min-w-0 w-full">
                <WorkerInput
                  workerInfo={workerInfo}
                  idx={idx}
                  workerId={workerId}
                  isInputActive={isInputActive}
                  setIsInputActive={setIsInputActive}
                  uniqueInput={uniqueInput}
                  setUniqueInput={setUniqueInput}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default WorkerInfos;
