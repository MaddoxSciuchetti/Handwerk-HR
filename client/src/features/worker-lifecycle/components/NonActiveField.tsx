import { UpdatePayload } from '@/features/task-management/types/index.types';
import { Dispatch, MouseEvent, SetStateAction } from 'react';
import { WorkerInfoItem } from '../consts/worker-info.consts';

type NonActiveFieldProps = {
  item: WorkerInfoItem;
  setInputState: Dispatch<SetStateAction<boolean | undefined>>;
  setUniqueInput: Dispatch<SetStateAction<number | undefined>>;
  setInputValue: Dispatch<SetStateAction<string | undefined>>;
  isPending: boolean;
  variables: UpdatePayload;
  idx: number;
};

const NonActiveField = ({
  item,
  setInputState,
  setUniqueInput,
  setInputValue,
  isPending,
  variables,
  idx,
}: NonActiveFieldProps) => {
  return (
    <>
      <span
        className="truncate"
        key={`${item.label}-value`}
        onClick={(e: MouseEvent<HTMLSpanElement>) => {
          e.stopPropagation();
          setInputState(true);
          setUniqueInput(idx);
          setInputValue('');
        }}
      >
        {isPending ? String(variables[item.schemaKey!]) : (item.value ?? '-')}
      </span>
    </>
  );
};

export default NonActiveField;
