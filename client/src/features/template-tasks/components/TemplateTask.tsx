import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { Button } from '@/components/ui/selfmade/button';
import {
  Table,
  TableDivider,
  TableHeader,
} from '@/components/ui/selfmade/table/Table';
import { SettingsStatusesHeader } from '@/features/settings/org-statuses/SettingsStatusesHeader';
import TemplateSidebar from '@/features/task-management/components/tasks/task-sidebar/TaskSidebar';
import { useEffect, useState } from 'react';
import z from 'zod';
import useFetchTask from '../hooks/useFetchTask';
import { useGetTemplates } from '../hooks/useGetTemplates';
import { useSubmitTemplate } from '../hooks/useSubmitTemplate';
import useTemplateModalContext from '../hooks/useTemplateModalContext';
import AddTemplateModal from './AddTemplateModal';
import EditTemplateModal from './EditTemplateModal';
import { TemplateItem } from './TemplateItem';

function TemplateTasks() {
  const {
    filteredByType,
    taskLengthByTemplateType,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    postsPerPage,
    paginatedType,
  } = useFetchTask();

  const { register, handleSubmit, onSubmit, errors } = useSubmitTemplate();
  const { data: templates, isLoading, isError } = useGetTemplates();

  const { modalState, closeTask, openCreateTask, openEditTask, tab, setTab } =
    useTemplateModalContext();

  const searchSchema = z.object({ search: z.string().min(1) });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [tab, setCurrentPage]);

  const renderModal = () => {
    switch (modalState.kind) {
      case 'open-create':
        return (
          <ModalOverlay handleToggle={closeTask}>
            <AddTemplateModal />
          </ModalOverlay>
        );
      case 'open-edit':
        return (
          <ModalOverlay handleToggle={closeTask}>
            <EditTemplateModal />
          </ModalOverlay>
        );
    }
  };
  if (isLoading) {
    return <LoadingAlert />;
  }

  return (
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 md:max-w-8xl">
      <div className="h-full w-full flex flex-col items-center justify-center">
        <SettingsStatusesHeader
          title="Template Aufgaben"
          description="Verwalte deine Template Aufgaben"
        />
        <Table className="w-200">
          <TableHeader className="gap-3 py-2">
            <Button type="button" onClick={() => setIsOpen(true)}>
              Hinzufügen
            </Button>
          </TableHeader>
          <TableDivider />
          <TemplateItem templates={templates ?? []} />
        </Table>
        <TemplateSidebar isOpen={isOpen} setIsOpen={setIsOpen} />

        {renderModal()}
      </div>
    </div>
  );
}

export default TemplateTasks;
