import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

type PdfSkeletonProps = {
  className?: string;
  page?: { width: number; height: number };
};

/** A paper placeholder using the same dimensions as the document preview. */
export function PdfSkeleton({
  className,
  page = { width: 210, height: 297 },
}: PdfSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="PDF wird geladen"
      className={cn(
        'min-h-0 min-w-0 flex-1 overflow-auto rounded-lg border bg-muted p-4',
        className
      )}
    >
      <span className="sr-only">PDF wird geladen…</span>
      <div
        aria-hidden="true"
        className="mx-auto max-w-full overflow-hidden bg-white p-[9%] shadow-md"
        style={{
          width: `${page.width}mm`,
          aspectRatio: `${page.width} / ${page.height}`,
        }}
      >
        <Skeleton className="mb-10 h-6 w-1/2 bg-neutral-200" />
        {[0, 1, 2].map((paragraph) => (
          <div key={paragraph} className="mb-8 space-y-3">
            {[0, 1, 2, 3].map((line) => (
              <Skeleton
                key={line}
                className={cn(
                  'h-3 bg-neutral-200',
                  line === 3 ? 'w-2/3' : 'w-full'
                )}
              />
            ))}
          </div>
        ))}
        <div className="mt-12 flex justify-between gap-8">
          <Skeleton className="h-3 w-2/5 bg-neutral-200" />
          <Skeleton className="h-3 w-2/5 bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}
