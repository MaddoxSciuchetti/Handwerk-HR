import { cn } from '@/lib/trycatch';
import { ReactNode } from 'react';

type ModalOverlayProps = {
  handleToggle: () => void;
  children: ReactNode;
  backdropClassName?: string;
  className?: string;
};

const ModalOverlay = ({
  handleToggle,
  children,
  backdropClassName,
  className,
}: ModalOverlayProps) => {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm',
        className
      )}
    >
      <div
        onClick={handleToggle}
        className={cn(
          'fixed inset-0 cursor-pointer bg-(--modal-overlay) ',
          backdropClassName
        )}
        aria-label="Close modal"
      />
      {children}
    </div>
  );
};

export default ModalOverlay;
