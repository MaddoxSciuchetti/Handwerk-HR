import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { WorkerTable } from '@/features/worker-lifecycle/components/WorkerTable';
import ProjectItem from '@/features/worker-lifecycle/components/ProjectItem';
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
  const team = new URLSearchParams(location.search).has('team');
  const workers = Array.from({ length: 16 }, (_, index) => ({
    id: `worker-${index}`,
    firstName: index ? `Worker ${index}` : 'Alexandra',
    lastName: 'Example',
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
      >
        <WorkerTable hideTaskColumns={team}>
          <TableHeader>
            <TableRow>
              {[
                'Name',
                'Typ',
                'Verantwortlich',
                ...(!team ? ['Aufgaben', 'Status'] : []),
              ].map((name) => (
                <TableHead key={name}>{name}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="[&_td]:py-4 [&_td]:px-2 [&_td:first-child]:pl-10">
            {workers.map((worker, index) => (
              <ProjectItem
                key={worker.id}
                worker={worker}
                hideTaskColumns={team}
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
