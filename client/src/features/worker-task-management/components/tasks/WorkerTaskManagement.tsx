import { cn } from '@/lib/utils';
import WorkerInformation from '@/features/worker-lifecycle/components/WorkerInformation';
import ErrorAlert from '@/components/alerts/ErrorAlert';
import { TableSelectAllCheckbox } from '@/components/ui/table-select-all-checkbox';
import { TableSkeletonRows } from '@/components/ui/table-skeleton';
import { PersonnelFoldersSkeleton } from '../files/FileSkeletons';
import { ClothingOrderTable } from '../clothing/ClothingOrderTable';
import { MaterialsTableSkeleton } from '../materials/MaterialsTable';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollableTableViewport } from '@/components/ui/scrollable-table-viewport';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LargeEditMode } from '@/features/all-tasks/components/LargeEditMode';
import { TaskItem } from '@/features/all-tasks/components/TaskItem';
import { TaskSidebar } from '@/features/all-tasks/components/TaskSidebar';
import { useTaskSidebar } from '@/features/all-tasks/hooks/useTaskSidebar';
import {
  clearContractSendReturn,
  peekContractSendReturn,
} from '../../contractSendReturn';
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import useFilteredData from '../../hooks/useFilteredData';
import useGetWorkerFiles from '../../hooks/useGetWorkerFiles';
import useTaskData from '../../hooks/useTaskData';
import { LifecycleType, WorkerTab } from '../../types/index.types';
import handleZipExport from '../../utils/handleZipExport';
import { ContractConfirmDialog } from '../files/ContractConfirmDialog';
import { ContractSendDialog } from '../files/ContractSendDialog';
import { ArbeitszeugnisSendDialog } from '../files/ArbeitszeugnisSendDialog';
import WorkerFileUploads from '../files/WorkerFileUploads';
import { ClothingTab } from '../clothing/ClothingTab';
import { MaterialsTab } from '../materials/MaterialsTab';
import { QuestionnaireSendDialog } from '@/features/questionnaire/QuestionnaireSendDialog';
import WorkerHeader from '../header/WorkerHeader';
import { WorkerTabButtons } from '../header/WorkerTabButtons';
import { engagementsAwaitingTemplate } from '../../pendingTemplate';
import { TemplateApplyPrompt } from './TemplateApplyPrompt';

type TaskManagementProps = {
  workerId: string;
};

const sectionHeaderClassName = 'h-12 py-3 pl-12 pr-2 text-sm font-medium';

const TaskManagement = ({ workerId }: TaskManagementProps) => {
  const [activeTab, setActiveTab] = useState<WorkerTab>('form');
  const [clothingAddOpen, setClothingAddOpen] = useState(false);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const materialFileInputRef = useRef<HTMLInputElement>(null);
  const [contractSend, setContractSend] = useState<{
    engagementId: string;
    issueId: string;
  } | null>(null);
  const [contractConfirm, setContractConfirm] = useState<{
    engagementId: string;
    issueId: string;
  } | null>(null);

  const [zeugnisIssueId, setZeugnisIssueId] = useState<string | null>(null);
  const [questionnaireEngagementId, setQuestionnaireEngagementId] = useState<
    string | null
  >(null);

  useEffect(() => {
    const pending = peekContractSendReturn();
    if (
      !pending ||
      pending.returnTo !== 'worker' ||
      pending.workerId !== workerId
    ) {
      return;
    }
    if (pending.kind === 'arbeitszeugnis') {
      setZeugnisIssueId(pending.issueId);
    } else {
      setContractSend({
        engagementId: pending.engagementId,
        issueId: pending.issueId,
      });
    }
    const timeout = window.setTimeout(() => clearContractSendReturn(), 0);
    return () => window.clearTimeout(timeout);
  }, [workerId]);
  const [largeEditMode, setLargeEditMode] = useState(false);
  const [editModeData, setEditModeData] = useState<
    { taskNumber: string; taskTitle: string }[]
  >([]);

  const handleSetEditModeData: Dispatch<
    SetStateAction<{ taskNumber: string; taskTitle: string }[]>
  > = (action) => {
    setEditModeData((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      setLargeEditMode(next.length > 0);
      return next;
    });
  };

  const { data, isLoading } = useTaskData(workerId, activeTab === 'form');
  const { displayData: allTasks } = useFilteredData(data);
  const engagements = data?.data.engagements ?? [];
  const hasOffboarding = engagements.some(
    (engagement) => engagement.type === 'offboarding'
  );
  const phaseKey = `${workerId}:${engagements
    .filter((engagement) => engagement.type === 'offboarding')
    .map((engagement) => engagement.id)
    .join(',')}`;
  const [phaseSelection, setPhaseSelection] = useState<{
    key: string;
    phase: LifecycleType;
  } | null>(null);
  const taskPhase =
    phaseSelection?.key === phaseKey
      ? phaseSelection.phase
      : hasOffboarding
        ? 'offboarding'
        : 'onboarding';
  const taskEngagements = engagements.filter((engagement) =>
    taskPhase === 'offboarding'
      ? engagement.type === 'offboarding'
      : engagement.type !== 'offboarding'
  );
  const taskEngagementIds = new Set(
    taskEngagements.map((engagement) => engagement.id)
  );
  const displayData = allTasks.filter((task) =>
    taskEngagementIds.has(task.workerEngagementId)
  );
  const selectVisibleTasks = (checked: boolean) => {
    const visibleIds = new Set(displayData.map((task) => task.id));
    handleSetEditModeData((previous) => {
      const remaining = previous.filter(
        (item) => !visibleIds.has(item.taskNumber)
      );
      if (!checked) return remaining;
      return [
        ...remaining,
        ...displayData.map((task) => ({
          taskNumber: task.id,
          taskTitle: task.title,
        })),
      ];
    });
  };
  const { fetchFiles } = useGetWorkerFiles(workerId);
  const {
    sidebarKey,
    sidebarProps,
    openForEdit,
    openForCreate,
    patchTaskEditState,
  } = useTaskSidebar();

  useEffect(() => {
    if (!sidebarProps.isOpen || sidebarProps.taskState !== 'edit') return;

    const task = displayData.find(
      (item) => item.id === sidebarProps.taskEditState.taskId
    );
    if (!task || task.status === sidebarProps.taskEditState.status) return;

    patchTaskEditState({ status: task.status });
  }, [
    displayData,
    patchTaskEditState,
    sidebarProps.isOpen,
    sidebarProps.taskEditState.status,
    sidebarProps.taskEditState.taskId,
    sidebarProps.taskState,
  ]);

  if (!data && !isLoading)
    return <ErrorAlert message="The tasks could not load, reload page" />;

  const workerLabel =
    `${data?.data.firstName ?? ''} ${data?.data.lastName ?? ''}`.trim();
  const templateTargets = (
    taskPhase === 'offboarding'
      ? taskEngagements
          .filter(
            (engagement) =>
              engagement.templateApplication ||
              !engagement.issues?.some((issue) => issue.templateItemId)
          )
          .map((engagement) => ({
            workerId,
            engagementId: engagement.id,
            label: workerLabel,
          }))
      : engagementsAwaitingTemplate(displayData, {
          workerId,
          label: workerLabel,
        })
  ).filter((target) => {
    const application = data?.data.engagements.find(
      (engagement) => engagement.id === target.engagementId
    )?.templateApplication;
    return !application?.resultsDismissedAt;
  });
  const waiting = taskEngagements.some(
    (engagement) => engagement.status === 'expected'
  );
  const pendingQuestionnaire = taskEngagements.find(
    (engagement) =>
      engagement.status === 'expected' && !engagement.questionnaireSubmission
  );

  return (
    <div
      className={cn(
        'mx-auto flex h-full min-h-0 flex-col rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl',
        activeTab === 'information' ? 'overflow-y-auto' : 'overflow-hidden'
      )}
    >
      <TaskSidebar
        key={sidebarKey}
        {...sidebarProps}
        showWorkerLink={false}
        onOpenArbeitszeugnis={setZeugnisIssueId}
      />
      {contractSend ? (
        <ContractSendDialog
          workerId={workerId}
          engagementId={contractSend.engagementId}
          issueId={contractSend.issueId}
          onClose={() => setContractSend(null)}
        />
      ) : null}
      {zeugnisIssueId ? (
        <ArbeitszeugnisSendDialog
          issueId={zeugnisIssueId}
          onClose={() => setZeugnisIssueId(null)}
          onSent={() => setZeugnisIssueId(null)}
        />
      ) : null}
      {questionnaireEngagementId ? (
        <QuestionnaireSendDialog
          engagementId={questionnaireEngagementId}
          onClose={() => setQuestionnaireEngagementId(null)}
        />
      ) : null}
      {contractConfirm ? (
        <ContractConfirmDialog
          workerId={workerId}
          engagementId={contractConfirm.engagementId}
          issueId={contractConfirm.issueId}
          onClose={() => setContractConfirm(null)}
        />
      ) : null}

      <Tabs
        value={activeTab}
        defaultValue="form"
        onValueChange={(value) => {
          if (
            value === 'information' ||
            value === 'form' ||
            value === 'files' ||
            value === 'materials' ||
            value === 'clothing'
          ) {
            setActiveTab(value);
            if (value !== 'clothing') setClothingAddOpen(false);
            if (value !== 'form') setQuestionnaireEngagementId(null);
          }
        }}
        className={cn(
          'flex min-h-0 flex-col',
          activeTab === 'information' ? 'flex-none' : 'flex-1'
        )}
      >
        <WorkerTabButtons
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab !== 'clothing') setClothingAddOpen(false);
            if (tab !== 'form') setQuestionnaireEngagementId(null);
          }}
        />
        <Card
          className={cn(
            'mt-3 flex min-h-0 flex-col gap-0 border border-border py-0 shadow-none ring-0',
            activeTab === 'information' ? 'flex-none' : 'flex-1'
          )}
        >
          <CardHeader className="flex min-h-14 shrink-0 flex-row flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-3">
            <WorkerHeader
              activeTab={activeTab}
              isLoading={isLoading}
              openForCreate={() =>
                openForCreate({
                  workerEngagementId: taskEngagements[0]?.id ?? '',
                })
              }
              hideCreate={waiting || taskEngagements.length === 0}
              onOpenFileUpload={() => setIsFileUploadOpen(true)}
              onAddFolder={() => setCreateFolderOpen(true)}
              onExportFiles={() => void handleZipExport(fetchFiles)}
              onUploadMaterials={() => materialFileInputRef.current?.click()}
              materialsUploadDisabled={engagements.length === 0}
              onAddClothing={() => setClothingAddOpen(true)}
              clothingAddDisabled={engagements.length === 0}
              onSendQuestionnaire={
                pendingQuestionnaire
                  ? () => setQuestionnaireEngagementId(pendingQuestionnaire.id)
                  : undefined
              }
            />
          </CardHeader>
          <CardContent
            className={cn(
              'flex min-h-0 flex-col px-2 pb-0',
              activeTab === 'information'
                ? 'flex-none'
                : 'flex-1 overflow-hidden'
            )}
          >
            <TabsContent value="information" className="mt-0 flex-none">
              <div className="mx-auto w-full max-w-3xl px-4 py-4">
                <WorkerInformation workerId={workerId} />
              </div>
            </TabsContent>
            <TabsContent
              value="form"
              className="mt-0 flex min-h-0 flex-1 flex-col"
            >
              {hasOffboarding && (
                <Tabs
                  value={taskPhase}
                  onValueChange={(phase) => {
                    if (phase !== 'onboarding' && phase !== 'offboarding')
                      return;
                    setPhaseSelection({ key: phaseKey, phase });
                    handleSetEditModeData([]);
                  }}
                  className="shrink-0 px-4 py-3"
                >
                  <TabsList aria-label="Aufgabenphase">
                    <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
                    <TabsTrigger value="offboarding">Offboarding</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
              <ScrollableTableViewport>
                <Table aria-busy={isLoading}>
                  <TableHeader className="sticky top-0 z-10 bg-card [&_tr]:border-0">
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableHead
                        className={`relative ${sectionHeaderClassName} bg-card`}
                      >
                        <div className="absolute inset-y-0 left-0 flex w-10 items-center justify-center">
                          <TableSelectAllCheckbox
                            ids={displayData.map((task) => task.id)}
                            selectedIds={editModeData.map(
                              (item) => item.taskNumber
                            )}
                            disabled={isLoading}
                            selectLabel="Alle Aufgaben auswählen"
                            clearLabel="Alle Aufgaben abwählen"
                            onCheckedChange={selectVisibleTasks}
                          />
                        </div>
                        Titel
                      </TableHead>
                      <TableHead className="h-12 bg-card py-3 px-2 text-right">
                        Beschreibung
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&_tr]:border-0 [&_td]:py-4 [&_td]:px-2 [&_td:first-child]:pl-10">
                    {isLoading ? (
                      <TableSkeletonRows variant="tasks" />
                    ) : displayData.length ? (
                      displayData.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          isSelected={editModeData.some(
                            (item) => item.taskNumber === task.id
                          )}
                          onOpenEdit={openForEdit}
                          onOpenContractSend={() =>
                            setContractSend({
                              engagementId: task.workerEngagementId,
                              issueId: task.id,
                            })
                          }
                          onOpenContractConfirm={() =>
                            setContractConfirm({
                              engagementId: task.workerEngagementId,
                              issueId: task.id,
                            })
                          }
                          setLargeEditMode={setLargeEditMode}
                          setEditModeData={handleSetEditModeData}
                        />
                      ))
                    ) : (
                      <TableRow className="border-0 hover:bg-transparent">
                        <TableCell
                          colSpan={2}
                          className="py-10 text-center text-sm text-muted-foreground"
                        >
                          Keine Aufgaben gefunden.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollableTableViewport>
            </TabsContent>
            <TabsContent
              value="files"
              className="mt-0 flex min-h-0 flex-1 flex-col"
            >
              <ScrollableTableViewport>
                {isLoading ? (
                  <PersonnelFoldersSkeleton />
                ) : (
                  <WorkerFileUploads
                    workerId={workerId}
                    engagements={engagements.map((engagement) => ({
                      id: engagement.id,
                      type: engagement.type,
                      startDate: engagement.startDate,
                    }))}
                    questionnaires={engagements.flatMap((engagement) =>
                      engagement.questionnaireSubmission?.status === 'completed'
                        ? [
                            {
                              id: engagement.questionnaireSubmission.id,
                              engagementId: engagement.id,
                              name: engagement.questionnaireSubmission.name,
                              engagementLabel: `${engagement.type === 'onboarding' ? 'Eintritt' : engagement.type === 'offboarding' ? 'Austritt' : 'Wechsel'}${engagement.startDate ? ` · ${new Date(engagement.startDate).toLocaleDateString('de-DE')}` : ''}`,
                              completedAt:
                                engagement.questionnaireSubmission.completedAt,
                            },
                          ]
                        : []
                    )}
                    contracts={engagements.flatMap((engagement) =>
                      engagement.employmentContract
                        ? [
                            {
                              engagementId: engagement.id,
                              id: engagement.employmentContract.id,
                              name: engagement.employmentContract.master.name,
                              status: engagement.employmentContract.status,
                            },
                          ]
                        : []
                    )}
                    certificates={engagements.flatMap((engagement) =>
                      engagement.arbeitszeugnis
                        ? [
                            {
                              id: engagement.arbeitszeugnis.id,
                              engagementId: engagement.id,
                              name: engagement.arbeitszeugnis.name,
                              text: engagement.arbeitszeugnis.text,
                            },
                          ]
                        : []
                    )}
                    isUploadModalOpen={isFileUploadOpen}
                    setIsUploadModalOpen={setIsFileUploadOpen}
                    createFolderOpen={createFolderOpen}
                    setCreateFolderOpen={setCreateFolderOpen}
                  />
                )}
              </ScrollableTableViewport>
            </TabsContent>
            <TabsContent
              value="materials"
              className="mt-0 flex min-h-0 flex-1 flex-col"
            >
              <ScrollableTableViewport className="flex flex-col">
                {isLoading ? (
                  <div className="px-4 py-4">
                    <MaterialsTableSkeleton />
                  </div>
                ) : (
                  <MaterialsTab
                    workerId={workerId}
                    fileInputRef={materialFileInputRef}
                    engagements={engagements.map((engagement) => ({
                      id: engagement.id,
                      type: engagement.type,
                      startDate: engagement.startDate,
                    }))}
                  />
                )}
              </ScrollableTableViewport>
            </TabsContent>
            <TabsContent
              value="clothing"
              className="mt-0 flex min-h-0 flex-1 flex-col"
            >
              <ScrollableTableViewport>
                {isLoading ? (
                  <div className="px-4 py-4">
                    <ClothingOrderTable
                      isLoading
                      items={[]}
                      returningId={null}
                      deletingId={null}
                      onReturn={async () => undefined}
                      onDelete={() => undefined}
                    />
                  </div>
                ) : (
                  <ClothingTab
                    workerId={workerId}
                    addOpen={clothingAddOpen}
                    onAddOpenChange={setClothingAddOpen}
                    engagements={engagements.map((engagement) => ({
                      id: engagement.id,
                      type: engagement.type,
                      startDate: engagement.startDate,
                    }))}
                  />
                )}
              </ScrollableTableViewport>
            </TabsContent>
          </CardContent>
        </Card>
        {largeEditMode ? (
          <LargeEditMode
            editModeData={editModeData}
            setLargeEditMode={setLargeEditMode}
            setEditModeData={handleSetEditModeData}
          />
        ) : activeTab === 'form' ? (
          <TemplateApplyPrompt
            key={`${phaseKey}:${taskPhase}`}
            targets={templateTargets}
          />
        ) : null}
      </Tabs>
    </div>
  );
};

export default TaskManagement;
