import ErrorStateAlert from '@/components/alerts/ErrorStateAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import useTemplateIssues from '../hooks/useTemplateIssues';
import CreateIssueModal from './CreateIssueModal';
import TemplateItem from './TemplateItem';
import TemplateItemHeader from './TemplateItemHeader';
type TemplateDetailPageProps = {
  templateId: string;
};

const TemplateDetailPage = ({ templateId }: TemplateDetailPageProps) => {
  const {
    data,
    isPending,
    isError,
    deleteItem,
    isCreating,
    addOpen,
    setAddOpen,
    title,
    setTitle,
    description,
    setDescription,
    handleAddItem,
  } = useTemplateIssues(templateId);

  const templateItemsByOrder = [...(data?.items ?? [])].sort(
    (left, right) => left.orderIndex - right.orderIndex
  );

  if (isPending) return <LoadingAlert />;
  if (isError || !data) {
    return (
      <div className="mx-auto w-5xl p-6 md:max-w-8xl">
        <ErrorStateAlert
          title="Laden fehlgeschlagen"
          message="Vorlage konnte nicht geladen werden."
          action={{
            label: 'Zurück',
            to: '/org-settings',
            search: { currentTab: 'templates' },
          }}
        />
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Vorlage bearbeiten"
      className="mx-auto flex h-full w-5xl flex-col overflow-auto rounded-2xl bg-card p-6 md:max-w-8xl"
    >
      <TemplateItemHeader setAddOpen={setAddOpen} data={data} />
      <TemplateItem
        templateItemsByOrder={templateItemsByOrder}
        deleteItem={deleteItem}
      />

      {addOpen && (
        <ModalOverlay handleToggle={() => setAddOpen(false)}>
          <CreateIssueModal
            handleAddItem={handleAddItem}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            setAddOpen={setAddOpen}
            isCreating={isCreating}
          />
        </ModalOverlay>
      )}
    </div>
  );
};

export default TemplateDetailPage;
