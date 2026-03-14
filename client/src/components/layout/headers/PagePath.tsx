import { LAYOUTITEMS } from '@/constants/layout.consts';
import { useLocation } from '@tanstack/react-router';

const toTitleCase = (value: string) =>
  value
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const getSidebarItemLabel = (pathname: string) => {
  const match = LAYOUTITEMS.find(
    (item) => pathname === item.to || pathname.startsWith(`${item.to}/`)
  );
  return match?.title ?? '';
};

const getWorkerLifecycleLabel = () => {
  const workerLifecycleItem = LAYOUTITEMS.find(
    (item) => item.to === '/worker-lifycycle'
  );

  return workerLifecycleItem?.title ?? 'Meine Handwerker';
};

const getCurrentPageLabel = (
  pathname: string,
  workerName: string,
  sidebarLabel: string
) => {
  if (sidebarLabel) return sidebarLabel;
  if (pathname.startsWith('/user/') && workerName) return workerName;

  const lastSegment = pathname.split('/').filter(Boolean).at(-1) ?? 'home';
  return toTitleCase(lastSegment);
};

const PagePath = () => {
  const { pathname, search } = useLocation();
  const params = new URLSearchParams(search);

  const previousPage = params.get('prevPage') ?? '';
  const workerName = params.get('workerName') ?? '';
  const sidebarLabel = getSidebarItemLabel(pathname);
  const currentPage = getCurrentPageLabel(pathname, workerName, sidebarLabel);
  const previousPageLabel = pathname.startsWith('/user/')
    ? getWorkerLifecycleLabel()
    : sidebarLabel || previousPage;

  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      {previousPageLabel && previousPageLabel !== currentPage && (
        <>
          <span className="text-muted-foreground">{previousPageLabel}</span>
          <span className="text-muted-foreground">/</span>
        </>
      )}
      <span className="text-foreground">{currentPage}</span>
    </div>
  );
};

export default PagePath;
