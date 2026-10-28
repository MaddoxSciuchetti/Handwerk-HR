import { PdfSkeleton } from '@/components/ui/pdf-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

const fieldWidths = ['w-28', 'w-36', 'w-44', 'w-16', 'w-32', 'w-24', 'w-40', 'w-20'];

export function ContractPreviewSkeleton() {
  return (
    <div
      role="status"
      aria-label="Vertragsvorschau wird geladen"
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      <span className="sr-only">Vertragsvorschau wird geladen…</span>
      <div className="shrink-0 pr-8" aria-hidden="true">
        <Skeleton className="h-5 w-48" />
        <div className="mt-3 flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-60 max-w-full" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden" aria-hidden="true">
        <aside
          data-testid="contract-preview-fields"
          className="flex w-60 shrink-0 flex-col gap-3 overflow-hidden"
        >
          <Skeleton className="h-5 w-36" />
          <ul className="flex flex-col gap-2">
            {fieldWidths.map((width, index) => (
              <li
                key={width}
                className="rounded-md border border-border bg-muted px-2 py-1.5"
              >
                <Skeleton
                  className={`h-3 bg-foreground/15 ${index % 2 ? 'w-20' : 'w-28'}`}
                />
                <Skeleton className={`mt-1.5 h-4 bg-foreground/15 ${width}`} />
              </li>
            ))}
          </ul>
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="ml-auto h-8 w-16" />
          <PdfSkeleton className="border-0 bg-card" />
        </div>
      </div>
      <div className="flex shrink-0 justify-end gap-2" aria-hidden="true">
        <Skeleton className="h-8 w-24 rounded-2xl" />
        <Skeleton className="h-8 w-24 rounded-2xl" />
      </div>
    </div>
  );
}
