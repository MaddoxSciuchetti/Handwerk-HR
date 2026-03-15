import { LAYOUTITEMS } from '@/constants/layout.consts';

export const getSidebarItemLabel = (pathname: string) => {
  const match = LAYOUTITEMS.find(
    (item) => pathname === item.to || pathname.startsWith(`${item.to}/`)
  );
  return match?.title ?? '';
};

export const getWorkerLifecycleLabel = () => {
  const workerLifecycleItem = LAYOUTITEMS.find(
    (item) => item.to === '/worker-lifycycle'
  );

  return workerLifecycleItem?.title ?? 'Meine Handwerker';
};

export const getCurrentPageLabel = (
  isUserPath: boolean,
  workerName: string,
  sidebarLabel: string
) => {
  if (sidebarLabel) return sidebarLabel;
  if (isUserPath && workerName) return workerName;
  return '';
};
