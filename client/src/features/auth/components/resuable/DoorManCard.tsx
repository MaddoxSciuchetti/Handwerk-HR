import { ReactNode } from 'react';

type DoorManCardProps = { children: ReactNode };

const DoorManCard = ({ children }: DoorManCardProps) => {
  return (
    <div className="flex h-dvh w-full items-center justify-center px-4">
      <div className="w-sm max-w-full rounded-lg bg-gray-700 p-8 shadow-lg">
        {children}
      </div>
    </div>
  );
};

export default DoorManCard;
