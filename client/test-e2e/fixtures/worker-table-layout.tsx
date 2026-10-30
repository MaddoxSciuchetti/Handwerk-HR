import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { stickyTableHeadClassName } from '@/components/ui/scrollable-table-viewport';
import {
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AddWorkerColumn } from '@/features/worker-lifecycle/components/AddWorkerColumn';
import { WorkerColumnSortButton } from '@/features/worker-lifecycle/components/WorkerColumnSortButton';
import { WorkerTable } from '@/features/worker-lifecycle/components/WorkerTable';
import ProjectItem from '@/features/worker-lifecycle/components/ProjectItem';
import {
  EXTRA_WORKER_COLUMN_OPTIONS,
  type ExtraColumnSort,
  type ExtraWorkerColumnId,
} from '@/features/worker-lifecycle/consts/extra-worker-columns';
import type {
  EngagementType,
  WorkerRecord,
} from '@/features/worker-lifecycle/types/index.types';
import '@/index.css';
import '@/App.css';

const queryClient = new QueryClient();

export function Harness() {
  const [type, setType] = useState<EngagementType>('transfer');
  const [pending, setPending] = useState(false);
  const [extraColumns, setExtraColumns] = useState<ExtraWorkerColumnId[]>([]);
  const [columnSort, setColumnSort] = useState<ExtraColumnSort | null>(null);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const team = new URLSearchParams(location.search).has('team');
  const availableExtraColumns = EXTRA_WORKER_COLUMN_OPTIONS.filter(
    (option) => !extraColumns.includes(option.id)
  );
  const showAddColumn = availableExtraColumns.length > 0;
  const addColumnOnLastFixed = showAddColumn && extraColumns.length === 0;
  const workers = Array.from({ length: 16 }, (_, index) => ({
    id: `worker-${index}`,
    firstName: index ? `Worker ${index}` : 'Alexandra',
    lastName: 'Example',
    entryDate: index ? '2017-03-04' : '2022-11-12',
    birthday: index ? '1990-04-01' : '1985-12-15',
    engagements: [
      {
        id: `phase-${index}`,
        type: index ? 'transfer' : type,
        status: 'pending',
        responsibleUser: { id: 'user', firstName: 'Anna', lastName: 'Example' },
        issues: [],
        issueCounts: [],
      },
    ],
  })) as unknown as WorkerRecord[];
  return (
    <QueryClientProvider client={queryClient}>
      <button onClick={() => setPending(false)}>Finish save</button>
      <div
        data-testid="viewport"
        className="h-96 overflow-auto [scrollbar-gutter:stable]"
        data-scrolled={headerScrolled ? '' : undefined}
        onScroll={(event) => {
          const next = event.currentTarget.scrollTop > 0;
          setHeaderScrolled((previous) =>
            previous === next ? previous : next
          );
        }}
      >
        <WorkerTable
          hideTaskColumns={team}
          extraColumnCount={extraColumns.length}
        >
          <TableHeader className="[&_tr]:border-b-0">
            <TableRow className="border-0 hover:bg-transparent">
              {[
                'Name',
                'Typ',
                'Verantwortlich',
                ...(!team ? ['Aufgaben', 'Status'] : []),
              ].map((name) => (
                <TableHead
                  key={name}
                  className={`relative ${addColumnOnLastFixed && name === (team ? 'Verantwortlich' : 'Status') ? 'pr-10' : 'pr-2'} ${stickyTableHeadClassName(headerScrolled)}`}
                >
                  {name}
                  {addColumnOnLastFixed &&
                    name === (team ? 'Verantwortlich' : 'Status') && (
                      <AddWorkerColumn
                        options={availableExtraColumns}
                        onAdd={(id) =>
                          setExtraColumns((previous) =>
                            previous.includes(id) ? previous : [...previous, id]
                          )
                        }
                      />
                    )}
                </TableHead>
              ))}
              {extraColumns.map((columnId, index) => {
                const option = EXTRA_WORKER_COLUMN_OPTIONS.find(
                  (entry) => entry.id === columnId
                );
                if (!option) return null;
                const showAdd =
                  showAddColumn && index === extraColumns.length - 1;
                return (
                  <TableHead
                    key={option.id}
                    className={`relative ${showAdd ? 'pr-10' : 'pr-2'} ${stickyTableHeadClassName(headerScrolled)}`}
                  >
                    <span className="inline-flex items-center">
                      {option.headerLabel}
                      <WorkerColumnSortButton
                        column={option.id}
                        sort={columnSort}
                        onToggle={(column) =>
                          setColumnSort((previous) =>
                            previous?.column === column
                              ? {
                                  column,
                                  direction:
                                    previous.direction === 'asc'
                                      ? 'desc'
                                      : 'asc',
                                }
                              : { column, direction: 'asc' }
                          )
                        }
                      />
                    </span>
                    {showAdd && (
                      <AddWorkerColumn
                        options={availableExtraColumns}
                        onAdd={(id) =>
                          setExtraColumns((previous) =>
                            previous.includes(id) ? previous : [...previous, id]
                          )
                        }
                      />
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody className="[&_td]:py-4 [&_td]:px-2 [&_td:first-child]:pl-10">
            {workers.map((worker, index) => (
              <ProjectItem
                key={worker.id}
                worker={worker}
                hideTaskColumns={team}
                extraColumns={extraColumns}
                gotopage={() => undefined}
                isSelected={false}
                setLargeEditMode={() => undefined}
                setEditModeData={() => undefined}
                onTypeChange={(next) => {
                  setType(next);
                  setPending(true);
                }}
                isChangingType={!index && pending}
                responsibleUsers={[]}
                onResponsibleChange={() => undefined}
                isChangingResponsible={false}
              />
            ))}
          </TableBody>
        </WorkerTable>
      </div>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById('root')!).render(<Harness />);
