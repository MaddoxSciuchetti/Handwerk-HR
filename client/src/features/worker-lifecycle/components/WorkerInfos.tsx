import { DescriptionFieldResponse } from '@/types/api.types';
import { Dispatch, SetStateAction } from 'react';
import { workerInfos } from '../consts/worker-info.consts';
import { FormType } from '../types/index.types';
import WorkerDescription from './WorkerDescription';
import WorkerInput from './WorkerInput';

type WorkerInfosProps = {
  workerInfo: DescriptionFieldResponse | undefined;
  lifecycleType: FormType;
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
  return (
    <>
      {workerInfo ? (
        <div className="w-full">
          {workerInfos(workerInfo)
            .filter(
              (value) =>
                !(
                  lifecycleType === 'Onboarding' &&
                  value.schemaKey === 'austrittsdatum'
                )
            )
            .map((item, idx) => (
              <div key={`${item.label}-${idx}`}>
                <div className="group flex items-center justify-between gap-4 py-3.5">
                  <WorkerDescription item={item} />
                  <div className="w-96 shrink-0">
                    <WorkerInput
                      item={item}
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
      ) : null}
    </>
  );
};

export default WorkerInfos;
