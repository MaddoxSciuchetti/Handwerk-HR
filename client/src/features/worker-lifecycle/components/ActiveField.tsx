import { UpdatePayload } from '@/features/task-management/types/index.types';
import { cn } from '@/lib/trycatch';
import { Check, X } from 'lucide-react';
import { Dispatch, MouseEvent, SetStateAction } from 'react';
import { WorkerInfoItem } from '../consts/worker-info.consts';

type ActiveFieldProps = {
  setInputState: Dispatch<SetStateAction<boolean | undefined>>;
  setInputValue: Dispatch<SetStateAction<string | undefined>>;
  handleSubmit: (item: WorkerInfoItem) => void;
  item: WorkerInfoItem;
  variables: UpdatePayload;
  isPending: boolean;
};

const ActiveField = ({
  setInputState,
  setInputValue,
  handleSubmit,
  item,
  variables,
  isPending,
}: ActiveFieldProps) => {
  return (
    <>
      <span className="flex">
        <input
          autoFocus
          className={cn(
            'flex-1 min-w-0 text-sm bg-transparent outline-none border-b border-foreground/30',
            'focus:border-foreground/70 transition-colors duration-150 pb-0.5',
            ' placeholder:text-muted-foreground/50'
          )}
          placeholder={`${isPending ? String(variables[item.schemaKey!]) : item.value}`}
          onChange={(e) => setInputValue(e.target.value)}
          onClick={(e: MouseEvent<HTMLInputElement>) => e.stopPropagation()}
        />
        <button
          onClick={() => setInputState(false)}
          className="cursor-pointer hover:text-(--destructive) p-1 text-muted-foreground transition-colors"
          aria-label="Abbrechen"
        >
          <X size={20} strokeWidth={1.75} />
        </button>
        <button
          className="cursor-pointer hover:text-(--chart-2)"
          onClick={() => handleSubmit(item)}
        >
          <Check size={20} strokeWidth={1.75} />
        </button>
      </span>
    </>
  );
};

export default ActiveField;
