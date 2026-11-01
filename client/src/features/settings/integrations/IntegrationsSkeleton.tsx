import { Skeleton } from '@/components/ui/skeleton';

export function IntegrationsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Integrationen werden geladen"
      className="min-h-0 min-w-0 w-full flex-1 overflow-y-auto"
    >
      <span className="sr-only">Integrationen werden geladen…</span>
      <div aria-hidden="true">
        <div className="px-3 pt-4">
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        {['Microsoft', 'Crewmeister', 'Strauss', 'EasyPark'].map(
          (provider, index) => (
            <div
              key={provider}
              className={`flex min-w-0 flex-col gap-3 border-b border-border px-3 py-6 ${index > 1 ? 'last:border-b-0' : ''}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold">{provider}</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-9 rounded-full" />
                    <Skeleton className="h-5 w-10" />
                  </div>
                  {index < 2 ? (
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  ) : null}
                </div>
              </div>
              {index < 2 ? (
                <div className="flex w-fit items-center gap-1.5 py-1">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="size-4" />
                </div>
              ) : null}
            </div>
          )
        )}
      </div>
    </div>
  );
}
