import { ReactNode } from 'react';

type DoorManCardProps = { children: ReactNode };

const DoorManCard = ({ children }: DoorManCardProps) => {
  return (
    <div className="flex h-dvh w-full items-center justify-center px-4">
      <div className="w-sm max-w-full rounded-lg border border-border bg-card p-8 text-card-foreground shadow-lg">
        {children}
      </div>
    </div>
  );
};

export default DoorManCard;
