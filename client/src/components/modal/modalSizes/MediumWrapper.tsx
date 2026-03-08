import { ReactNode } from 'react';

type LifeCycleModalProps = { children: ReactNode };

const MediumWrapper = ({ children }: LifeCycleModalProps) => {
  return (
    <div className="z-50 mx-auto flex min-h-120 max-h-100 w-2xl flex-col items-center justify-center rounded-lg bg-white p-4 text-center">
      {children}
    </div>
  );
};

export default MediumWrapper;
