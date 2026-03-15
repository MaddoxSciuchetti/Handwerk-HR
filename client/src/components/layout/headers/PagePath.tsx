import { useLocation } from '@tanstack/react-router';
import {
  getCurrentPageLabel,
  getSidebarItemLabel,
  getWorkerLifecycleLabel,
} from '../utils/header.utils';

const PagePath = () => {
  const { pathname, search } = useLocation();
  const params = new URLSearchParams(search);

  const previousPage = params.get('prevPage') ?? '';
  const workerName = params.get('workerName') ?? '';
  const isUserPath = pathname.startsWith('/user/');
  const sidebarLabel = getSidebarItemLabel(pathname);
  const currentPage = getCurrentPageLabel(isUserPath, workerName, sidebarLabel);
  const previousPageLabel = isUserPath
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
