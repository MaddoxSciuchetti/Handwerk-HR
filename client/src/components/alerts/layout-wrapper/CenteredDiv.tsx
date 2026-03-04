import { ReactNode } from 'react';

type CenteredDivProps = {
  children: ReactNode;
};

const CenteredDiv = ({ children }: CenteredDivProps) => {
  return (
    <div className="flex items-center justify-center h-full">{children}</div>
  );
};

export default CenteredDiv;
