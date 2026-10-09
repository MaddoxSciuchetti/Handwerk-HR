import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
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
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { LargeEditMode } from '@/features/all-tasks/components/LargeEditMode';
import { TaskItem } from '@/features/all-tasks/components/TaskItem';
import { TaskSidebar } from '@/features/all-tasks/components/TaskSidebar';
import { useTaskSidebar } from '@/features/all-tasks/hooks/useTaskSidebar';
import {
  clearContractSendReturn,
  peekContractSendReturn,
} from '../../contractSendReturn';
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import useFilteredData from '../../hooks/useFilteredData';
import useGetWorkerFiles from '../../hooks/useGetWorkerFiles';
import useTaskData from '../../hooks/useTaskData';
import { WorkerTab } from '../../types/index.types';
import handleZipExport from '../../utils/handleZipExport';
import { ContractConfirmDialog } from '../files/ContractConfirmDialog';
import { ContractSendDialog } from '../files/ContractSendDialog';
import { ArbeitszeugnisSendDialog } from '../files/ArbeitszeugnisSendDialog';
import WorkerFileUploads from '../files/WorkerFileUploads';
import { MaterialsTab } from '../materials/MaterialsTab';
import WorkerHeader from '../header/WorkerHeader';
import { WorkerTabButtons } from '../header/WorkerTabButtons';

type TaskManagementProps = {
  workerId: string;
};

const sectionHeaderClassName = 'h-12 py-3 pl-10 pr-2 text-sm font-medium';

const TaskManagement = ({ workerId }: TaskManagementProps) => {
  const [activeTab, setActiveTab] = useState<WorkerTab>('form');
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
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

  const { data, isLoading } = useTaskData(workerId);
  const { displayData } = useFilteredData(data);
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

  if (isLoading) return <LoadingAlert />;
  if (!data)
    return <ErrorAlert message="The tasks could not load, reload page" />;

  const waiting = data.data.engagements.some(
    (engagement) => engagement.status === 'expected'
  );

  return (
    <div className="mx-auto flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <TaskSidebar
        key={sidebarKey}
        {...sidebarProps}
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
          if (value === 'form' || value === 'files' || value === 'materials') {
            setActiveTab(value);
          }
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <WorkerTabButtons activeTab={activeTab} onTabChange={setActiveTab} />
        <Card className="mt-3 flex min-h-0 flex-1 flex-col gap-0 border border-border py-0 shadow-none ring-0">
          <CardHeader className="flex min-h-14 shrink-0 flex-row flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-3">
            <WorkerHeader
              activeTab={activeTab}
              openForCreate={() =>
                openForCreate({
                  workerEngagementId:
                    data.data.engagements.find(
                      (engagement) => engagement.type === 'offboarding'
                    )?.id ??
                    data.data.engagements[0]?.id ??
                    '',
                })
              }
              hideCreate={waiting}
              onOpenFileUpload={() => setIsFileUploadOpen(true)}
              onExportFiles={() => void handleZipExport(fetchFiles)}
              onUploadMaterials={() => materialFileInputRef.current?.click()}
              materialsUploadDisabled={data.data.engagements.length === 0}
            />
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-0">
            <TabsContent value="form" className="mt-0 flex min-h-0 flex-1 flex-col">
              <ScrollableTableViewport>
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card [&_tr]:border-0">
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableHead
                        className={`${sectionHeaderClassName} bg-card`}
                      >
                        Titel
                      </TableHead>
                      <TableHead className="h-12 bg-card py-3 px-2" />
                      <TableHead className="h-12 bg-card py-3 px-2 text-right">
                        Beschreibung
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&_tr]:border-0 [&_td]:py-4 [&_td]:px-2 [&_td:first-child]:pl-10">
                    {displayData.length ? (
                      displayData.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          workerId={workerId}
                          isSelected={editModeData.some(
                            (item) => item.taskNumber === task.id
                          )}
                          onOpenEdit={openForEdit}
                          onOpenContractSend={(task) =>
                            setContractSend({
                              engagementId: task.workerEngagementId,
                              issueId: task.id,
                            })
                          }
                          onOpenContractConfirm={(task) =>
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
                          colSpan={3}
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
            <TabsContent value="files" className="mt-0 flex min-h-0 flex-1 flex-col">
              <ScrollableTableViewport>
                <div className={sectionHeaderClassName}>Name</div>
                <WorkerFileUploads
                  workerId={workerId}
                  contracts={data.data.engagements.flatMap((engagement) =>
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
                  certificates={data.data.engagements.flatMap((engagement) =>
                    engagement.arbeitszeugnis
                      ? [
                          {
                            id: engagement.arbeitszeugnis.id,
                            name: engagement.arbeitszeugnis.name,
                            text: engagement.arbeitszeugnis.text,
                          },
                        ]
                      : []
                  )}
                  isUploadModalOpen={isFileUploadOpen}
                  setIsUploadModalOpen={setIsFileUploadOpen}
                />
              </ScrollableTableViewport>
            </TabsContent>
            <TabsContent
              value="materials"
              className="mt-0 flex min-h-0 flex-1 flex-col"
            >
              <ScrollableTableViewport>
                <MaterialsTab
                  workerId={workerId}
                  fileInputRef={materialFileInputRef}
                  engagements={data.data.engagements.map((engagement) => ({
                    id: engagement.id,
                    type: engagement.type,
                    startDate: engagement.startDate,
                  }))}
                />
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
        ) : null}
      </Tabs>
    </div>
  );
};

export default TaskManagement;
