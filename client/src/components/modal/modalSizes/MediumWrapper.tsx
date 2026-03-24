import { ReactNode } from 'react';

type LifeCycleModalProps = {
  children: ReactNode;
  width?: string;
  height?: string;
};

const MediumWrapper = ({
  children,
  width = 'w-2xl',
  height = 'min-h-120 max-h-100',
}: LifeCycleModalProps) => {
  return (
    <div
      className={`z-50 mx-auto flex ${height} ${width} flex-col items-center justify-center rounded-lg border border-border bg-(--modal-surface) p-4 text-center text-foreground shadow-lg`}
    >
      {children}
    </div>
  );
};

export default MediumWrapper;
