import { DrawerStackProvider } from '@/components/ui/drawer-stack';
import ErrorAlert from '@/components/alerts/ErrorAlert';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { workerLifecycleQueries } from '../query-options/queries/worker-lifycycle.queries';
import { isTeamMember } from '../utils/teamMembers';
import { CockpitQuarter } from './CockpitQuarter';
import { CockpitSectionCard } from './CockpitSectionCard';
import { CockpitSectionSheet } from './CockpitSectionSheet';
import {
  COCKPIT_SECTIONS,
  type CockpitSectionId,
} from './cockpit-section.consts';
import { CockpitSectionBody } from './cockpitSections';
import GreetingHeader from './GreetingHeader';
import NextAnniversary from './NextAnniversary';

/** 2×2 panels only when the Cockpit pane itself is wide enough for four readable columns. */
const FULL_GRID_MIN_WIDTH = 1600;

function useCompactCockpit(container: HTMLElement | null) {
  // Default compact: IDE / split panes often leave a narrow content area
  // even when the browser window is wide.
  const [compact, setCompact] = useState(true);

  useEffect(() => {
    if (!container) return;

    const update = (width: number) => {
      setCompact(width < FULL_GRID_MIN_WIDTH);
    };

    update(container.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (typeof width === 'number') update(width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [container]);

  return compact;
}

export default function CockpitPage() {
  const { user, isLoading, isError } = useAuth();
  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null);
  const compact = useCompactCockpit(rootEl);
  const [openSection, setOpenSection] = useState<CockpitSectionId | null>(null);
  const {
    data: workers,
    error,
    isLoading: workersLoading,
  } = useQuery(workerLifecycleQueries.workerData());

  if (isError || (!isLoading && !user)) return <ErrorAlert />;
  if (error) return <ErrorAlert message={error.message} />;

  return (
    <DrawerStackProvider>
      <div
        ref={setRootEl}
        className="mx-auto flex h-full min-h-0 w-full flex-col overflow-y-auto rounded-2xl bg-card p-4 text-card-foreground md:max-w-8xl md:p-6 xl:overflow-hidden"
      >
        <GreetingHeader
          firstname={user?.firstName || ''}
          isLoading={isLoading}
        />
        <NextAnniversary
          people={(workers ?? []).filter((worker) => isTeamMember(worker))}
          isLoading={isLoading || workersLoading}
        />

        {compact ? (
          <>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {COCKPIT_SECTIONS.map((section) => (
                <CockpitSectionCard
                  key={section.id}
                  section={section}
                  onOpen={() => setOpenSection(section.id)}
                />
              ))}
            </div>
            <CockpitSectionSheet
              openSection={openSection}
              isLoading={isLoading}
              onOpenChange={(open) => {
                if (!open) setOpenSection(null);
              }}
            />
          </>
        ) : (
          <div className="mt-4 grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-3">
            {COCKPIT_SECTIONS.map((section) => (
              <CockpitQuarter key={section.id} title={section.title}>
                <CockpitSectionBody id={section.id} isLoading={isLoading} />
              </CockpitQuarter>
            ))}
          </div>
        )}
      </div>
    </DrawerStackProvider>
  );
}
