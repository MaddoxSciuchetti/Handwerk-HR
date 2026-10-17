import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BestandTab } from '@/features/bestand/BestandTab';
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
import { useWorkerFilter } from '@/features/worker-lifecycle/hooks/useWorkerFilter';
import useWorkerMutations from '@/features/worker-lifecycle/hooks/useWorkerMutaitons';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { QuestionnaireSendDialog } from '@/features/questionnaire/QuestionnaireSendDialog';
import GreetingHeader from './GreetingHeader';
import ProjectItem, { type WorkerSelection } from './ProjectItem';
import { WorkerSidebar } from './WorkerSidebar';

function WorkerLifeCycle() {
  const { user, isLoading, isError } = useAuth();
  const { error, workers, modal, toggleModal, handleNavigate } = useHome();
  const [isWorkerSidebarOpen, setIsWorkerSidebarOpen] = useState(false);
  const [questionnaireEngagementId, setQuestionnaireEngagementId] = useState<string | null>(
    null
  );

  const [largeEditMode, setLargeEditMode] = useState(false);
  const [editModeData, setEditModeData] = useState<WorkerSelection[]>([]);
  const { deleteWorkersMutation } = useWorkerMutations();
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

  return (
    <div className="mx-auto flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <WorkerSidebar
        isOpen={isWorkerSidebarOpen}
        setIsOpen={setIsWorkerSidebarOpen}
        onQuestionnaire={(draft) => setQuestionnaireEngagementId(draft.engagementId)}
      />
      {questionnaireEngagementId ? (
        <QuestionnaireSendDialog
          engagementId={questionnaireEngagementId}
          onClose={() => setQuestionnaireEngagementId(null)}
        />
      ) : null}
      <div className="flex h-full min-h-0 w-full flex-col">
        <GreetingHeader firstname={user?.firstName || ''} />
        <Tabs
          defaultValue="handwerker"
          className="mt-5 flex min-h-0 flex-1 flex-col gap-4"
        >
          <TabsList variant="line" className="h-9 w-fit shrink-0 justify-start gap-2 px-1">
            <TabsTrigger value="handwerker" className="px-3 text-base">
              Handwerker
            </TabsTrigger>
            <TabsTrigger
              value="bestand"
              className="px-3 text-base"
              data-testid="bestand-tab-trigger"
            >
              Bestand
            </TabsTrigger>
          </TabsList>
          <TabsContent value="handwerker" className="flex min-h-0 flex-1 flex-col">
            <Card className="flex min-h-0 flex-1 flex-col gap-0 border border-border py-0 shadow-none ring-0">
              <CardHeader className="flex shrink-0 flex-row flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-3">
                <CardTitle className="text-base font-medium">Handwerker</CardTitle>
                <div className="flex shrink-0 items-center gap-3">
                  <NestedDropdown
                    options={filterOptions}
                    value={filterLabel}
                    onSelect={handleSelect}
                    onSubSelect={handleSubSelect}
                  />
                  <Button
                    type="button"
                    className="rounded-2xl"
                    onClick={handleSelectWorker}
                  >
                    Hinzufügen
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-0">
                <ScrollableTableViewport>
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-card [&_tr]:border-0">
                      <TableRow className="border-0 hover:bg-transparent">
                        <TableHead className="h-12 bg-card py-3 pl-10 pr-2">
                          Name
                        </TableHead>
                        <TableHead className="bg-card py-3 px-2">Type</TableHead>
                        <TableHead className="bg-card py-3 px-2">
                          Verantwortlich
                        </TableHead>
                        <TableHead className="bg-card py-3 px-2">Aufgaben</TableHead>
                        <TableHead className="bg-card py-3 px-2">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="[&_tr]:border-0 [&_td]:py-4 [&_td]:px-2 [&_td:first-child]:pl-10">
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
                </ScrollableTableViewport>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="bestand" className="flex min-h-0 flex-1 flex-col">
            <BestandTab />
          </TabsContent>
        </Tabs>
        <LifeCycleModal
          modal={modal}
          toggleModal={toggleModal}
          onQuestionnaire={(draft) => setQuestionnaireEngagementId(draft.engagementId)}
        />
        {largeEditMode && (
          <EditModeBar
            selectedItems={editModeData}
            setSelectedItems={handleSetEditModeData}
            isPending={false}
            onDelete={handleDeleteSelected}
            onClose={() => setLargeEditMode(false)}
          />
        )}
      </div>
    </div>
  );
}

export default WorkerLifeCycle;
