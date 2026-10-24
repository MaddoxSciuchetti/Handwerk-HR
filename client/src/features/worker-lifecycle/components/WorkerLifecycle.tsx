import ErrorAlert from '@/components/alerts/ErrorAlert';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { TableSkeletonRows } from '@/components/ui/table-skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NestedDropdown } from '@/components/ui/nested-dropdown';
import { ScrollableTableViewport } from '@/components/ui/scrollable-table-viewport';
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
import { useSwitchEngagementType } from '@/features/worker-lifecycle/hooks/useSwitchEngagementType';
import { useWorkerFilter } from '@/features/worker-lifecycle/hooks/useWorkerFilter';
import useWorkerMutations from '@/features/worker-lifecycle/hooks/useWorkerMutaitons';
import type {
  EngagementType,
  WorkerRecord,
} from '@/features/worker-lifecycle/types/index.types';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { QuestionnaireSendDialog } from '@/features/questionnaire/QuestionnaireSendDialog';
import GreetingHeader from './GreetingHeader';
import { LifecycleStatistics } from './LifecycleStatistics';
import ProjectItem, { type WorkerSelection } from './ProjectItem';
import { WorkerSidebar } from './WorkerSidebar';
import { WorkerSelectAllCheckbox } from './WorkerSelectAllCheckbox';
import { useChangeResponsibleUser } from '../hooks/useChangeResponsibleUser';

function WorkerLifeCycle() {
  const { user, isLoading, isError } = useAuth();
  const {
    error,
    workers,
    modal,
    toggleModal,
    handleNavigate,
    isLoading: workersLoading,
  } = useHome();
  const [isWorkerSidebarOpen, setIsWorkerSidebarOpen] = useState(false);
  const [questionnaireEngagementId, setQuestionnaireEngagementId] = useState<
    string | null
  >(null);

  const [largeEditMode, setLargeEditMode] = useState(false);
  const [editModeData, setEditModeData] = useState<WorkerSelection[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { deleteWorkersMutation, isDeletingWorkers } = useWorkerMutations();
  const { mutate: switchEngagementType, isPending: isSwitchingType } =
    useSwitchEngagementType();
  const { mutate: changeResponsibleUser, isPending: isChangingResponsible } =
    useChangeResponsibleUser();
  const isSelectionPending =
    isDeletingWorkers || isSwitchingType || isChangingResponsible;
  const {
    employees,
    filterLabel,
    filterOptions,
    filteredWorkers,
    handleSelect,
    handleSubSelect,
  } = useWorkerFilter(workers);

  useBodyScrollLock();

  if (isError || (!isLoading && !user)) return <ErrorAlert />;
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
    if (isSelectionPending) return;
    const ids = editModeData
      .map((item) => item.engagementNumber)
      .filter((id) => id.length > 0);
    if (!ids.length) return;
    setIsDeleteConfirmOpen(false);
    const selected = editModeData;
    setEditModeData([]);
    setLargeEditMode(false);
    deleteWorkersMutation(ids, {
      onError: () => {
        setEditModeData(selected);
        setLargeEditMode(true);
      },
    });
  };

  const handleSwitchType = (worker: WorkerRecord, type: EngagementType) => {
    const engagement = worker.engagements[0];
    if (!engagement || engagement.type === type || isSelectionPending) return;
    switchEngagementType({
      items: [{ workerId: worker.id, engagementId: engagement.id }],
      type,
    });
  };

  return (
    <div className="mx-auto flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="Handwerker wirklich löschen?"
        description={
          editModeData.length === 1
            ? `Möchtest du „${editModeData[0].engagementTitle}“ wirklich dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden. Hinweis: Die Microsoft-Lizenzen bleiben diesem Handwerker weiterhin zugewiesen.`
            : `Möchtest du die ${editModeData.length} ausgewählten Handwerker wirklich dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden. Hinweis: Die Microsoft-Lizenzen bleiben den jeweiligen Handwerkern weiterhin zugewiesen.`
        }
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteSelected}
      />
      <WorkerSidebar
        isOpen={isWorkerSidebarOpen}
        setIsOpen={setIsWorkerSidebarOpen}
        onQuestionnaire={(draft) =>
          setQuestionnaireEngagementId(draft.engagementId)
        }
      />
      {questionnaireEngagementId ? (
        <QuestionnaireSendDialog
          engagementId={questionnaireEngagementId}
          onClose={() => setQuestionnaireEngagementId(null)}
        />
      ) : null}
      <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto">
        <GreetingHeader
          firstname={user?.firstName || ''}
          isLoading={isLoading}
        />
        <LifecycleStatistics />
        <Card className="mt-5 flex min-h-64 shrink-0 flex-1 flex-col gap-0 border border-border py-0 shadow-none ring-0">
          <CardHeader className="flex shrink-0 flex-row flex-wrap items-center justify-between gap-4 px-6 py-3">
            <CardTitle className="text-base font-medium">Handwerker</CardTitle>
            <div className="flex shrink-0 items-center gap-3">
              <NestedDropdown
                options={filterOptions}
                value={filterLabel}
                placeholder="Filter"
                className="border-border bg-muted shadow-none hover:bg-muted focus-visible:border-border focus-visible:ring-0 aria-expanded:bg-muted dark:border-border dark:bg-muted dark:hover:bg-muted"
                onSelect={handleSelect}
                onSubSelect={handleSubSelect}
              />
              <Button
                type="button"
                className="rounded-2xl border-primary"
                onClick={handleSelectWorker}
              >
                Hinzufügen
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-0">
            <ScrollableTableViewport>
              <Table aria-busy={isLoading || workersLoading}>
                <TableHeader className="sticky top-0 z-10 bg-card [&_tr]:border-b-0">
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className="relative h-12 bg-card py-3 pl-12 pr-2">
                      <div className="absolute inset-y-0 left-0 flex w-10 items-center justify-center">
                        <WorkerSelectAllCheckbox
                          workers={filteredWorkers}
                          selected={editModeData}
                          onChange={handleSetEditModeData}
                          disabled={isLoading || workersLoading || isSelectionPending}
                        />
                      </div>
                      Name
                    </TableHead>
                    <TableHead className="bg-card py-3 px-2">Typ</TableHead>
                    <TableHead className="bg-card py-3 px-2">
                      Verantwortlich
                    </TableHead>
                    <TableHead className="bg-card py-3 px-2">
                      Aufgaben
                    </TableHead>
                    <TableHead className="bg-card py-3 px-2">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr]:border-0 [&_td]:py-4 [&_td]:px-2 [&_td:first-child]:pl-10">
                  {isLoading || workersLoading ? (
                    <TableSkeletonRows variant="workers" />
                  ) : (
                    filteredWorkers.map((worker) => (
                      <ProjectItem
                        key={worker.id}
                        worker={worker}
                        gotopage={handleNavigate}
                        isSelected={editModeData.some(
                          (item) => item.engagementNumber === worker.id
                        )}
                        setLargeEditMode={setLargeEditMode}
                        setEditModeData={handleSetEditModeData}
                        onTypeChange={(type) => handleSwitchType(worker, type)}
                        isChangingType={isSelectionPending}
                        responsibleUsers={employees}
                        isChangingResponsible={isSelectionPending}
                        onResponsibleChange={(userId) => {
                          const engagement = worker.engagements[0];
                          if (
                            isSelectionPending ||
                            engagement.responsibleUser.id === userId
                          )
                            return;
                          changeResponsibleUser({
                            workerId: worker.id,
                            engagementId: engagement.id,
                            userId,
                          });
                        }}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollableTableViewport>
          </CardContent>
        </Card>
        <LifeCycleModal
          modal={modal}
          toggleModal={toggleModal}
          onQuestionnaire={(draft) =>
            setQuestionnaireEngagementId(draft.engagementId)
          }
        />
        {largeEditMode && (
          <EditModeBar
            selectedItems={editModeData}
            setSelectedItems={handleSetEditModeData}
            isPending={isSelectionPending}
            onDelete={() => setIsDeleteConfirmOpen(true)}
            deleteLabel="Ausgewählte Handwerker löschen"
            onClose={() => setLargeEditMode(false)}
          />
        )}
      </div>
    </div>
  );
}

export default WorkerLifeCycle;
