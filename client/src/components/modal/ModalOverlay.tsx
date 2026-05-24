import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

type ModalOverlayProps = {
  handleToggle: () => void;
  children: ReactNode;
  backdropClassName?: string;
  className?: string;
  size?: string;
};

const ModalOverlay = ({
  handleToggle,
  children,
  backdropClassName,
  className,
  size = 'max-w-md',
}: ModalOverlayProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleToggle();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleToggle]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Modal"
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm',
        className
      )}
    >
      <div
        onClick={handleToggle}
        className={cn(
          'fixed inset-0 cursor-pointer bg-(--modal-overlay)',
          backdropClassName
        )}
        aria-hidden="true"
      />

      <div className={`relative z-10 w-full ${size}`}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleToggle}
          aria-label="Modal schließen"
          className="absolute top-3 right-3 z-20"
        >
          <X />
        </Button>
        {children}
      </div>
    </div>
  );
};

export default ModalOverlay;
