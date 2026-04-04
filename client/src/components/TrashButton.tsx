import { Button } from '@/components/ui/button';
import { TrashIcon } from 'lucide-react';

type TrashButtonProps = {
  disabled?: boolean;
  description: string;
  onClick: () => void;
};

const TrashButton = ({ disabled, description, onClick }: TrashButtonProps) => {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      disabled={disabled}
      className="cursor-pointer rounded-md text-muted-foreground hover:text-[var(--destructive)] disabled:cursor-not-allowed disabled:opacity-50"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      aria-label={`${description} öffnen`}
    >
      <TrashIcon className="h-4 w-4" />
    </Button>
  );
};

export default TrashButton;
