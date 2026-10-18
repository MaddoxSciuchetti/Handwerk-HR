import { Skeleton } from '@/components/ui/skeleton';

export function PersonnelFoldersSkeleton() {
  return (
    <div
      role="status"
      aria-label="Dateiordner werden geladen"
      className="px-10 py-4"
    >
      <span className="sr-only">Dateiordner werden geladen…</span>
      <div aria-hidden="true" className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col items-start gap-3 rounded-xl border border-border p-4"
          >
            <Skeleton className="size-8" />
            <Skeleton className="h-5 w-28 max-w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FileCardsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Dateien werden geladen"
      className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
    >
      <span className="sr-only">Dateien werden geladen…</span>
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex flex-col rounded-xl border border-border p-3"
        >
          <Skeleton className="ml-auto size-7" />
          <Skeleton className="mx-auto size-15 rounded-xl" />
          <Skeleton className="mx-auto mb-2 h-8 w-8" />
          <Skeleton className="mx-auto h-5 w-28 max-w-full" />
          <Skeleton className="mx-auto mt-1 h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
