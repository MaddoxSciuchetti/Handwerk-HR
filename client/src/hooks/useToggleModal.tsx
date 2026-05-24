import { useState } from 'react';

export function useToggleModal() {
  const [modal, setModal] = useState<boolean>(false);
  const toggleModal = () => {
    setModal((prev) => !prev);
  };

  return { modal, toggleModal, setModal };
}
