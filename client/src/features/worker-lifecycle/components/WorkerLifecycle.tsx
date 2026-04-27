import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/selfmade/button';
import { SelectDropdown } from '@/components/ui/selfmade/selectdropdown';
import {
  Cell,
  CellHolder,
  GrowingItem,
  ItemHeader,
  Table,
  TableDivider,
  TableHeader,
} from '@/components/ui/selfmade/table/Table';
import EditModeBar from '@/features/all-tasks/components/EditModeBar';
import useAuth from '@/features/user-profile/hooks/useAuth';
import LifeCycleModal from '@/features/worker-lifecycle/components/LifeCycleModal';
import useHome from '@/features/worker-lifecycle/hooks/useHome';
import { useWorkerFilter } from '@/features/worker-lifecycle/hooks/useWorkerFilter';
import useWorkerMutations from '@/features/worker-lifecycle/hooks/useWorkerMutaitons';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { ChevronUp } from 'lucide-react';
import { useState } from 'react';
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
      <div className="h-full w-full flex flex-col">
        <GreetingHeader firstname={user?.firstName || ''} />
        <Table>
          <TableHeader className="flex w-full flex-wrap items-center justify-between gap-4 px-6 py-3">
            <GrowingItem className="!grow-0 !py-0 text-foreground">
              Handwerker
            </GrowingItem>
            <div className="flex shrink-0 items-center gap-3">
              <SelectDropdown
                state="Default"
                size="lg"
                icon={ChevronUp}
                label="Select Option"
                options={filterOptions}
                value={filterLabel}
                setValue={handleSelect}
                onSubSelect={handleSubSelect}
              />
              <Button
                type="button"
                className="shrink-0 border-0 bg-interactive-primary-bg text-sm text-interactive-primary-text hover:bg-interactive-primary-hover"
                onClick={handleSelectWorker}
              >
                Hinzufügen
              </Button>
            </div>
          </TableHeader>
          <TableDivider />
          <ItemHeader className="px-4 py-0">
            <GrowingItem className="pl-10 py-2">
              <p className="typo-body-sm text-foreground">Name</p>
            </GrowingItem>
            <CellHolder>
              <Cell className="typo-body-sm text-foreground">Type</Cell>
              <Cell className="typo-body-sm text-foreground">Verantwortlich</Cell>
              <Cell className="typo-body-sm text-foreground">Zuletzt bearbeitet</Cell>
              <Cell className="typo-body-sm text-foreground">Status</Cell>
            </CellHolder>
          </ItemHeader>
          {filteredWorkers.map((worker) => (
            <ProjectItem
              key={worker.id}
              worker={worker}
              gotopage={handleNavigate}
              isSelected={editModeData.some(
                (item) => item.engagementNumber === worker.id
              )}
              setLargeEditMode={setLargeEditMode}
              setEditModeData={setEditModeData}
            />
          ))}
        </Table>
        <LifeCycleModal modal={modal} toggleModal={toggleModal} />
        {largeEditMode && (
          <EditModeBar
            selectedItems={editModeData}
            setSelectedItems={setEditModeData}
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
