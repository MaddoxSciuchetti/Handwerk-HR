import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NestedDropdown } from '@/components/ui/nested-dropdown';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import EditModeBar from '@/features/all-tasks/components/EditModeBar';
import useAuth from '@/features/user-profile/hooks/useAuth';
import LifeCycleModal from '@/features/worker-lifecycle/components/LifeCycleModal';
import useHome from '@/features/worker-lifecycle/hooks/useHome';
import { useWorkerFilter } from '@/features/worker-lifecycle/hooks/useWorkerFilter';
import useWorkerMutations from '@/features/worker-lifecycle/hooks/useWorkerMutaitons';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useState, type Dispatch, type SetStateAction } from 'react';
import GreetingHeader from './GreetingHeader';
import ProjectItem, { type WorkerSelection } from './ProjectItem';
import { WorkerSidebar } from './WorkerSidebar';

function WorkerLifeCycle() {
  const { user, isLoading, isError } = useAuth();
  const { error, workers, modal, toggleModal, handleNavigate } = useHome();
  const [isWorkerSidebarOpen, setIsWorkerSidebarOpen] = useState(false);

  const [largeEditMode, setLargeEditMode] = useState(false);
  const [editModeData, setEditModeData] = useState<WorkerSelection[]>([]);
  const { deleteWorkersMutation, isDeletingWorkers } = useWorkerMutations();
  const {
    filterLabel,
    filterOptions,
    filteredWorkers,
    handleSelect,
    handleSubSelect,
  } = useWorkerFilter(workers);

  useBodyScrollLock();

  if (isLoading) return <LoadingAlert />;
  if (isError || !user) return <ErrorAlert />;
  if (error) return <ErrorAlert message={error.message} />;

  const handleSelectWorker = () => setIsWorkerSidebarOpen(true);

  const handleSetEditModeData: Dispatch<SetStateAction<WorkerSelection[]>> = (
    action
  ) => {
    setEditModeData((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      setLargeEditMode(next.length > 0);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    const ids = editModeData
      .map((item) => item.engagementNumber)
      .filter((id) => id.length > 0);
    if (!ids.length) return;
    deleteWorkersMutation(ids, {
      onSuccess: () => {
        setEditModeData([]);
        setLargeEditMode(false);
      },
    });
  };

  return (
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <WorkerSidebar
        isOpen={isWorkerSidebarOpen}
        setIsOpen={setIsWorkerSidebarOpen}
      />
      <div className="flex h-full w-full flex-col">
        <GreetingHeader firstname={user?.firstName || ''} />
        <Card className="mt-5 flex h-full flex-col gap-0 border border-border py-0 shadow-none ring-0">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-3">
            <CardTitle className="text-base font-medium">Handwerker</CardTitle>
            <div className="flex shrink-0 items-center gap-3">
              <NestedDropdown
                options={filterOptions}
                value={filterLabel}
                onSelect={handleSelect}
                onSubSelect={handleSubSelect}
              />
              <Button type="button" className="rounded-2xl" onClick={handleSelectWorker}>
                Hinzufügen
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader className="[&_tr]:border-0">
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead className="pl-14">Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Verantwortlich</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr]:border-0">
                {filteredWorkers.map((worker) => (
                  <ProjectItem
                    key={worker.id}
                    worker={worker}
                    gotopage={handleNavigate}
                    isSelected={editModeData.some(
                      (item) => item.engagementNumber === worker.id
                    )}
                    setLargeEditMode={setLargeEditMode}
                    setEditModeData={handleSetEditModeData}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <LifeCycleModal modal={modal} toggleModal={toggleModal} />
        {largeEditMode && (
          <EditModeBar
            selectedItems={editModeData}
            setSelectedItems={handleSetEditModeData}
            isPending={isDeletingWorkers}
            onDelete={handleDeleteSelected}
            onClose={() => setLargeEditMode(false)}
          />
        )}
      </div>
    </div>
  );
}

export default WorkerLifeCycle;
