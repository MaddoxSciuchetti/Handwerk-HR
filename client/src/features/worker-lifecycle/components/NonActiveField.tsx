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
    <div className="w-full">
      <span className="grid w-full grid-cols-[1fr_auto] items-center gap-1">
        <span
          className="block w-full cursor-text truncate border-b border-foreground/30 pb-0.5 text-left text-sm text-foreground"
          key={`${item.label}-value`}
          onClick={(e: MouseEvent<HTMLSpanElement>) => {
            e.stopPropagation();
            setInputState(true);
            setUniqueInput(idx);
            setInputValue(String(item.value));
          }}
        >
          {isPending ? String(variables[item.schemaKey!]) : (item.value ?? '-')}
        </span>
        <span className="flex items-center justify-end gap-1 opacity-0">
          <span className="h-7 w-7" />
          <span className="h-7 w-7" />
        </span>
      </span>
    </div>
  );
};

export default NonActiveField;
