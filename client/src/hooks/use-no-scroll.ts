import { useCallback, useEffect } from 'react';

export const useBodyScrollLock = () => {
  const lockScroll = useCallback(() => {
    // Save current scroll position
    const scrollY = window.scrollY;

    // Prevent scrollbar width shift
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    // Store scroll position for restoration
    document.body.setAttribute('data-scroll-y', scrollY.toString());
  }, []);

  const unlockScroll = useCallback(() => {
    const scrollY = parseInt(
      document.body.getAttribute('data-scroll-y') || '0'
    );

    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.removeAttribute('data-scroll-y');

    // Restore scroll position
    window.scrollTo(0, scrollY);
  }, []);

  useEffect(() => {
    lockScroll();

    return () => {
      unlockScroll();
    };
  }, [lockScroll, unlockScroll]);

  return { lockScroll, unlockScroll };
};
