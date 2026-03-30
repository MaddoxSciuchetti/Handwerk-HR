import { cn } from '@/lib/trycatch';
import { Check, X } from 'lucide-react';
import { Dispatch, MouseEvent, SetStateAction } from 'react';

type ActiveFieldProps = {
  setIsInputActive: Dispatch<SetStateAction<boolean | undefined>>;
  handleInputChange: (value: string) => void;
  handleSubmit: () => void;
  inputValue: string | undefined;
};

const ActiveField = ({
  setIsInputActive,
  handleInputChange,
  handleSubmit,
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
          value={inputValue ?? ''}
          onChange={(e) => handleInputChange(e.target.value)}
          onClick={(e: MouseEvent<HTMLInputElement>) => e.stopPropagation()}
        />
        <span className="flex items-center justify-end gap-1">
          <button
            onClick={() => setIsInputActive(false)}
            className="cursor-pointer p-1 text-muted-foreground transition-colors hover:text-[var(--destructive)]"
            aria-label="Abbrechen"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
          <button
            className="cursor-pointer p-1 text-muted-foreground transition-colors hover:text-[var(--chart-2)]"
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
