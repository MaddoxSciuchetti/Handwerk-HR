import { Dispatch, SetStateAction } from 'react';
import { workerInfos } from '../consts/worker-info.consts';
import { WorkerDetailResponse } from '../types/index.types';
import WorkerDescription from './WorkerDescription';
import WorkerInput from './WorkerInput';

type WorkerInfosProps = {
  workerInfo: WorkerDetailResponse;
  workerId: string;
  isInputActive: boolean | undefined;
  setIsInputActive: Dispatch<SetStateAction<boolean | undefined>>;
  uniqueInput: number | undefined;
  setUniqueInput: Dispatch<SetStateAction<number | undefined>>;
};

const WorkerInfos = ({
  workerInfo,
  workerId,
  isInputActive,
  setIsInputActive,
  uniqueInput,
  setUniqueInput,
}: WorkerInfosProps) => {
  const workers = workerInfos(workerInfo);
  return (
    <>
      <div className="w-full">
        {workers.map((workerInfo, idx) => (
          <div key={`${workerInfo.label}-${idx}`}>
            <div className="group flex items-center justify-between gap-4 py-3.5">
              <WorkerDescription workerInfo={workerInfo} />
              <div className="w-96 shrink-0">
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
