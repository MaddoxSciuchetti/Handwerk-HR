import { Fragment } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function QuestionnaireSkeleton() {
  return (
    <div role="status" aria-label="Fragebogen wird geladen">
      <span className="sr-only">Fragebogen wird geladen…</span>
      <div aria-hidden="true" className="flex flex-col">
        {[0, 1, 2, 3].map((index) => (
          <Fragment key={index}>
            {index > 0 ? <div className="h-14" /> : null}
            <div className="rounded-2xl border border-border px-5 py-4">
              <div className="mb-3 flex h-7 items-start justify-between gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-7 w-20 rounded-2xl" />
              </div>
              <div className="flex flex-col gap-3">
                <Skeleton className="h-3.5 w-48 max-w-full" />
                {index < 2 ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <div className="flex flex-col gap-2">
                    {[0, 1].map((option) => (
                      <div key={option} className="flex h-5 items-center gap-2">
                        <Skeleton className="size-4 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            </div>
          </Fragment>
        ))}
        <div className="h-14" />
      </div>
    </div>
  );
}
