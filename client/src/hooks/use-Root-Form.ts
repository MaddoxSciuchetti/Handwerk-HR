import { useEffect, useState } from 'react';
import { useBodyScrollLock } from './use-no-scroll';

function useRootForm(owner: string | null | undefined) {
  const { lockScroll, unlockScroll } = useBodyScrollLock();
  const [tab, setTab] = useState<'EDIT' | 'ADD'>('EDIT');
  const [selectedValue, setSelectedValue] = useState(owner || '');

  useEffect(() => {
    lockScroll();

    return () => {
      unlockScroll();
    };
  }, [lockScroll, unlockScroll]);

  return { tab, setTab, selectedValue, setSelectedValue };
}

export default useRootForm;
