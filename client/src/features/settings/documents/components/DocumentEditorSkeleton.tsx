import { Skeleton } from '@/components/ui/skeleton';
import { fromSegments, type StyledDocument } from '../styledDocument';
import { DocumentEditorCanvas } from './DocumentEditorCanvas';

// The placeholders retain the widths of the editor's text buttons so wrapping
// follows the same layout as the ready toolbar.
const toolbarLabels = [
  'Fett',
  'Kursiv',
  'Unterstrichen',
  'Liste',
  'Nummeriert',
  'Tabelle',
  'Seitenumbruch',
  'Rückgängig',
  'Fließtext linksbündig',
  'Alles linksbündig',
];

function ToolbarButtonSkeleton({ label }: { label: string }) {
  return (
    <Skeleton className="inline-flex h-7 shrink-0 items-center rounded-lg border border-transparent px-2.5 text-[0.8rem] font-medium whitespace-nowrap">
      <span className="invisible">{label}</span>
    </Skeleton>
  );
}

export function DocumentEditorSkeleton({
  document,
  master = false,
  readOnly = false,
  section = 'content',
  pageView = false,
  showCorner = false,
  showOriginalToggle = false,
}: {
  document: StyledDocument;
  master?: boolean;
  readOnly?: boolean;
  section?: 'content' | 'header' | 'footer';
  pageView?: boolean;
  showCorner?: boolean;
  showOriginalToggle?: boolean;
}) {
  const showToolbar = !readOnly;
  const framed = showToolbar || showCorner;
  return (
    <div
      role="status"
      aria-label="Word-Editor wird geladen"
      className="flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <span className="sr-only">Word-Editor wird geladen…</span>
      <div
        aria-hidden="true"
        className={
          framed
            ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-card'
            : 'flex min-h-0 min-w-0 flex-1 flex-col gap-2'
        }
      >
        {framed ? (
          <div className="flex shrink-0 items-start gap-2 bg-card px-2 py-2">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {showToolbar ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {toolbarLabels.map((label) => (
                    <ToolbarButtonSkeleton key={label} label={label} />
                  ))}
                  <div className="mx-1 h-6 w-px bg-border" />
                  <Skeleton className="h-7 w-36" />
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-7 w-36" />
                  <Skeleton className="h-7 w-32" />
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-7 w-16" />
                  <ToolbarButtonSkeleton label="Bild hinzufügen" />
                </div>
              ) : null}
              {showToolbar ? (
                <div className="space-y-2 border-t pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-11 w-44" />
                    <Skeleton className="h-11 w-40" />
                    <Skeleton className="h-11 w-44" />
                    <ToolbarButtonSkeleton label="Feld einsetzen" />
                  </div>
                </div>
              ) : null}
            </div>
            {pageView ? <Skeleton className="h-8 w-16" /> : null}
            {showCorner ? (
              <div className="flex shrink-0 items-center gap-1">
                {showOriginalToggle ? (
                  <ToolbarButtonSkeleton label="Original vergleichen" />
                ) : null}
                <Skeleton className="size-7" />
              </div>
            ) : null}
          </div>
        ) : null}
        {pageView && !framed ? (
          <div>
            <Skeleton className="ml-auto h-8 w-16" />
          </div>
        ) : null}
        <DocumentEditorCanvas
          document={document}
          values={{}}
          section={section}
          pageView={pageView}
          zoom={100}
          pageCount={1}
        >
          <div className="relative space-y-8">
            <Skeleton className="mb-10 h-6 w-1/2 bg-neutral-200" />
            {[0, 1, 2].map((paragraph) => (
              <div key={paragraph} className="space-y-3">
                {[0, 1, 2, 3, 4].map((line) => (
                  <Skeleton
                    key={line}
                    className={`h-3 bg-neutral-200 ${line === 4 ? 'w-2/3' : 'w-full'}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </DocumentEditorCanvas>
      </div>
    </div>
  );
}

const emptyDocument = fromSegments([]);

export function DocumentMasterEditorSkeleton() {
  return (
    <div className="mx-auto flex h-full min-h-0 min-w-0 w-full flex-col gap-3 overflow-y-auto rounded-2xl bg-card p-4 text-card-foreground">
      <div className="shrink-0" aria-hidden="true">
        <Skeleton className="size-8" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3" aria-hidden="true">
          <div className="flex w-full max-w-sm min-w-0 items-center gap-3">
            <span className="shrink-0 text-sm font-medium">Name</span>
            <Skeleton className="h-9 min-w-0 flex-1" />
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-2xl" />
            <Skeleton className="h-8 w-20 rounded-2xl" />
          </div>
        </div>
        <div className="flex min-h-[60vh] min-w-0 flex-1 gap-4">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <DocumentEditorSkeleton
              document={emptyDocument}
              master
              pageView
              showCorner
            />
          </div>
        </div>
      </div>
    </div>
  );
}
