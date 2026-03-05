import { Spinner } from '../ui/spinner';

const LoadingAlert = () => {
  return (
    <div className="flex min-h-svh w-full items-center justify-center">
      <Spinner className="w-8" />
    </div>
  );
};

export default LoadingAlert;
