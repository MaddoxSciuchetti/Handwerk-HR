import ModalOverlay from '@/components/modal/ModalOverlay';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import useDescription from '@/features/TemplateTasks/hooks/use-GetDescription';
import { TABS } from '@/lib/constants';
import { cn } from '@/types/utils';
import Tasks from './Tasks';
import TemplateModal from './TemplateModal';

function TemplateTasks() {
  const {
    editDescriptionMutation,
    handleAddSubmitMutation,
    modal,
    modalState,
    openDescriptionModal,
    deleteDescription,
    tab,
    setTab,
    mode,
    setMode,
    OnboardingData,
    OffboardingData,
    handleOpenModal,
    EmployeeData,
  } = useDescription();

  if (OnboardingData === undefined || OffboardingData === undefined) {
    return <Spinner className="size-8" />;
  }

  return (
    <div className="flex flex-col rounded-2xl overflow-x-auto w-full h-full p-6 shadow-gray-200 shadow-lg overflow-auto">
      <div className="flex gap-2 justify-start">
        {TABS.map(({ value, label }) => (
          <Button
            key={value}
            variant={tab === value ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer',
              tab === value ? 'bg-gray-400 text-white' : 'bg-gray-200'
            )}
            onClick={() => setTab(value)}
          >
            {label}
          </Button>
        ))}
        <img
          className="w-7 cursor-pointer"
          src="assets/copy.svg"
          onClick={() => {
            openDescriptionModal();
            setMode('ADD');
          }}
          alt="add description"
        />
      </div>

      <Tasks
        items={tab === 'ONBOARDING' ? OnboardingData : OffboardingData}
        deleteDescription={deleteDescription}
        openDescriptionModal={openDescriptionModal}
        mode={mode}
        setMode={setMode}
      />

      {modalState.selectedItem && modal && (
        <ModalOverlay handleToggle={handleOpenModal}>
          <TemplateModal
            editDescriptionMutation={editDescriptionMutation}
            handleAddSubmitMutation={handleAddSubmitMutation}
            form_field_id={modalState.selectedItem.form_field_id}
            description={modalState.selectedItem.description}
            owner={modalState.selectedItem.owner}
            template_type={tab}
            EmployeeData={EmployeeData}
            OnboardingData={OnboardingData}
            OffboardingData={OffboardingData}
            mode={mode}
            setMode={setMode}
          />
        </ModalOverlay>
      )}
    </div>
  );
}

export default TemplateTasks;
