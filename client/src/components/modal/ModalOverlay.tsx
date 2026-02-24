import { ReactNode } from 'react';

type ModalOverlayProps = {
  handleToggle: () => void;
  children: ReactNode;
};

const ModalOverlay = ({ handleToggle, children }: ModalOverlayProps) => {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        onClick={handleToggle}
        className="fixed inset-0 bg-black/50 cursor-pointer"
        aria-label="Close modal"
      />
      {children}
    </div>
  );
};

export default ModalOverlay;
