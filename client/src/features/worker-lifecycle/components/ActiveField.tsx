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
  inputValue: string | undefined;
};

const ActiveField = ({
  setInputState,
  setInputValue,
  handleSubmit,
  item,
  variables,
  isPending,
  inputValue,
}: ActiveFieldProps) => {
  return (
    <div className="w-full">
      <span className="grid w-full grid-cols-[1fr_auto] items-center gap-1">
        <input
          autoFocus
          className={cn(
            'w-full min-w-0 text-sm bg-transparent outline-none border-b border-foreground/30',
            'focus:border-foreground/70 transition-colors duration-150 pb-0.5',
            ' placeholder:text-muted-foreground/50'
          )}
          value={inputValue}
          placeholder={`${isPending ? String(variables[item.schemaKey!]) : item.value}`}
          onChange={(e) => setInputValue(e.target.value)}
          onClick={(e: MouseEvent<HTMLInputElement>) => e.stopPropagation()}
        />
        <span className="flex items-center justify-end gap-1">
          <button
            onClick={() => setInputState(false)}
            className="cursor-pointer p-1 text-muted-foreground transition-colors hover:text-(--destructive)"
            aria-label="Abbrechen"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
          <button
            className="cursor-pointer p-1 text-muted-foreground transition-colors hover:text-(--chart-2)"
            onClick={() => handleSubmit(item)}
          >
            <Check size={20} strokeWidth={1.75} />
          </button>
        </span>
      </span>
    </div>
  );
};

export default ActiveField;
