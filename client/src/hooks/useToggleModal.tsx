import { useSidebar } from '@/components/ui/sidebar/sidebar';
import { useState } from 'react';

export function useToggleModal() {
  const { toggleSidebar } = useSidebar();
  const [modal, setModal] = useState<boolean>(false);
  const toggleModal = () => {
    if (!modal) {
      setModal(true);
      toggleSidebar();
    } else {
      setModal(false);
      toggleSidebar();
    }
  };

  return { modal, toggleModal, setModal };
}
