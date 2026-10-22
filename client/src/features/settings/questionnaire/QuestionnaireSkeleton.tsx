import { Skeleton } from '@/components/ui/skeleton';

export function QuestionnaireSkeleton() {
  return (
    <div role="status" aria-label="Fragebogen wird geladen">
      <span className="sr-only">Fragebogen wird geladen…</span>
      <div aria-hidden="true" className="flex min-w-0 flex-col">
        {(['text', 'choice', 'table', 'hours'] as const).map((kind) => (
          <div key={kind}>
            <div className="relative min-w-0 rounded-2xl border border-border bg-card py-5 pr-12 pl-5">
              <Skeleton className="absolute top-3 right-3 size-6" />
              <div className="flex min-w-0 flex-col gap-3">
                {kind === 'text' || kind === 'choice' ? (
                  <>
                    <div className="flex min-w-0 items-center gap-2">
                      <Skeleton className="h-4 w-16 shrink-0" />
                      <Skeleton className="my-2 h-4 w-64 min-w-0" />
                    </div>
                    <div className="flex min-w-0 items-start gap-2">
                      <Skeleton className="mt-2 h-4 w-16 shrink-0" />
                      {kind === 'text' ? (
                        <Skeleton className="h-8 min-w-0 flex-1" />
                      ) : (
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          {[0, 1].map((option) => (
                            <div
                              key={option}
                              className="flex h-5 items-center gap-2"
                            >
                              <Skeleton className="size-4 shrink-0 rounded-full" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : kind === 'table' ? (
                  <>
                    <Skeleton className="h-5 w-64 max-w-full" />
                    <div className="grid grid-cols-3 overflow-hidden rounded-md border border-border">
                      {[0, 1, 2].map((column) => (
                        <div
                          key={column}
                          className="min-w-0 border-r border-border px-3 py-2 last:border-r-0"
                        >
                          <Skeleton className="h-5 w-full max-w-24" />
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <Skeleton className="h-5 w-48 min-w-0" />
                      <Skeleton className="h-8 w-24 shrink-0 rounded-2xl" />
                    </div>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                      {Array.from({ length: 7 }, (_, day) => (
                        <div key={day} className="flex min-w-0 flex-col gap-1">
                          <Skeleton className="h-3.5 w-6" />
                          <Skeleton className="h-9 w-full" />
                        </div>
                      ))}
                    </div>
                    <Skeleton className="h-5 w-8" />
                  </>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <SwitchSkeleton />
                  {kind === 'table' ? (
                    <Skeleton className="h-9 w-44 rounded-2xl" />
                  ) : null}
                </div>
              </div>
            </div>
            <div className="h-6" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SwitchSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-5 w-9 shrink-0 rounded-full" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}
