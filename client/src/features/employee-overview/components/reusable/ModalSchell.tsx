import { ReactNode } from 'react';

type ModalSchellProps = { children: ReactNode };

const ModalSchell = ({ children }: ModalSchellProps) => {
  return (
    <div className="z-50 mt-40 mx-auto flex min-h-120 max-h-120 w-full max-w-md flex-col rounded-xl border bg-gray-200 p-6">
      <div className="flex w-full flex-col">{children}</div>
    </div>
  );
};

export default ModalSchell;
