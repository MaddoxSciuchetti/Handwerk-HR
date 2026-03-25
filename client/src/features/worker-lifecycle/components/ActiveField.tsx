import { UpdatePayload } from '@/features/task-management/types/index.types';
import { cn } from '@/lib/trycatch';
import { Check, X } from 'lucide-react';
import { Dispatch, MouseEvent, SetStateAction } from 'react';
import { WorkerInfoItem } from '../consts/worker-info.consts';
import { getPlaceholderValue } from '../utils/workerInputDisplay';

type ActiveFieldProps = {
  setIsInputActive: Dispatch<SetStateAction<boolean | undefined>>;
  setInputValue: (value: string) => void;
  handleSubmit: () => void;
  item: WorkerInfoItem;
  variables: UpdatePayload;
  inputValue: string | undefined;
};

const ActiveField = ({
  setIsInputActive,
  setInputValue,
  handleSubmit,
  item,
  variables,
  inputValue,
}: ActiveFieldProps) => {
  const placeholderValue = getPlaceholderValue(item, variables);

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
          placeholder={String(placeholderValue)}
          onChange={(e) => setInputValue(e.target.value)}
          onClick={(e: MouseEvent<HTMLInputElement>) => e.stopPropagation()}
        />
        <span className="flex items-center justify-end gap-1">
          <button
            onClick={() => setIsInputActive(false)}
            className="cursor-pointer p-1 text-muted-foreground transition-colors hover:text-(--destructive)"
            aria-label="Abbrechen"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
          <button
            className="cursor-pointer p-1 text-muted-foreground transition-colors hover:text-(--chart-2)"
            onClick={handleSubmit}
          >
            <Check size={20} strokeWidth={1.75} />
          </button>
        </span>
      </span>
    </div>
  );
};

export default ActiveField;
