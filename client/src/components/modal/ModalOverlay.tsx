import { ReactNode } from 'react';

type ModalOverlayProps = {
  handleToggle: () => void;
  children: ReactNode;
};

const ModalOverlay = ({ handleToggle, children }: ModalOverlayProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        onClick={handleToggle}
        className="fixed inset-0 cursor-pointer bg-(--modal-overlay)"
        aria-label="Close modal"
      />
      {children}
    </div>
  );
};

export default ModalOverlay;
