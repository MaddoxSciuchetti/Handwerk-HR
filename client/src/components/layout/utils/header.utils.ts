import { LAYOUTITEMS, SETTINGSITEMS } from '@/constants/layout.consts';
import { isCockpitOwnedPath } from '@/features/worker-lifecycle/components/cockpit-section.consts';

export type BreadcrumbCrumb = {
  label: string;
  to?: string;
};

export const getSidebarItemLabel = (pathname: string) => {
  const match = [...LAYOUTITEMS, ...SETTINGSITEMS].find(
    (item) => pathname === item.to || pathname.startsWith(`${item.to}/`)
  );
  return match?.title ?? '';
};

export const getSidebarItemTo = (pathname: string) => {
  const match = [...LAYOUTITEMS, ...SETTINGSITEMS].find(
    (item) => pathname === item.to || pathname.startsWith(`${item.to}/`)
  );
  return match?.to ?? '';
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

const settingsRootMatch = (pathname: string) =>
  SETTINGSITEMS.find(
    (item) =>
      pathname === item.to ||
      pathname.startsWith(`${item.to}/`) ||
      ('activePaths' in item &&
        Array.isArray(item.activePaths) &&
        item.activePaths.some(
          (path: string) => pathname === path || pathname.startsWith(`${path}/`)
        ))
  );

/** Nested settings detail (e.g. document editor, mail template). */
const settingsDetailLabel = (pathname: string): string | null => {
  if (/^\/settings\/documents\/[^/]+$/.test(pathname)) return 'Dokument';
  if (/^\/settings\/mail-templates\/[^/]+$/.test(pathname)) return 'Vorlage';
  return null;
};

export const getBreadcrumbCrumbs = ({
  pathname,
  workerName,
}: {
  pathname: string;
  workerName: string;
}): BreadcrumbCrumb[] => {
  if (pathname.startsWith('/user/')) {
    const crumbs: BreadcrumbCrumb[] = [
      {
        label: getWorkerLifecycleLabel(),
        to: '/worker-lifycycle',
      },
    ];
    if (workerName) {
      crumbs.push({ label: workerName });
    }
    return crumbs;
  }

  // Cockpit owns these sections — never label them as Einstellungen.
  if (isCockpitOwnedPath(pathname)) {
    const section = settingsRootMatch(pathname);
    const crumbs: BreadcrumbCrumb[] = [{ label: 'Cockpit', to: '/cockpit' }];
    if (section) {
      const detail = settingsDetailLabel(pathname);
      if (detail && pathname !== section.to) {
        crumbs.push({ label: section.title });
        crumbs.push({ label: detail });
      } else {
        crumbs.push({ label: section.title });
      }
    }
    return crumbs;
  }

  const isSettingsPath =
    pathname.startsWith('/settings') || pathname === '/bestand';

  if (isSettingsPath) {
    const section = settingsRootMatch(pathname);
    const crumbs: BreadcrumbCrumb[] = [
      {
        label: 'Einstellungen',
        to: '/settings/profile',
      },
    ];

    if (section) {
      const detail = settingsDetailLabel(pathname);
      if (detail && pathname !== section.to) {
        crumbs.push({ label: section.title, to: section.to });
        crumbs.push({ label: detail });
      } else {
        crumbs.push({ label: section.title });
      }
    }

    return crumbs;
  }

  const layoutItem = LAYOUTITEMS.find(
    (item) => pathname === item.to || pathname.startsWith(`${item.to}/`)
  );

  if (layoutItem) {
    return [{ label: layoutItem.title }];
  }

  const label = getSidebarItemLabel(pathname);
  return label ? [{ label }] : [];
};
