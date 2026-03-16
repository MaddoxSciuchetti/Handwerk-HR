import { cn } from '@/lib/trycatch';
import { Spinner } from '../ui/spinner';

type LoadingAlertProps = {
  fullScreen?: boolean;
  className?: string;
};

const LoadingAlert = ({ fullScreen = false, className }: LoadingAlertProps) => {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-center',
        fullScreen ? 'min-h-svh' : 'min-h-[calc(100svh-4rem)]',
        className
      )}
    >
      <Spinner className="w-8" />
    </div>
  );
};

export default LoadingAlert;
