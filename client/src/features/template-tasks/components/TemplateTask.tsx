import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import useEditDescription from '../hooks/useEditDescription';
import useFetchTask from '../hooks/useFetchTask';
import useGetDescription from '../hooks/useGetDescription';
import TabsHeader from './TabsHeader';
import Tasks from './Tasks';
import TemplateModal from './TemplateModal';

function TemplateTasks() {
  const {
    handleAddSubmitMutation,
    modal,
    tab,
    setTab,
    mode,
    setMode,
    toggleModal,
  } = useGetDescription();
  const { OnboardingData, OffboardingData } = useFetchTask();

  const {
    editDescriptionMutation,
    modalState,
    setModalState,
    openDescriptionModal,
  } = useEditDescription(toggleModal);

  const onboardingLength = OnboardingData?.length || 0;
  const offboardingLength = OffboardingData?.length || 0;

  if (OnboardingData === undefined || OffboardingData === undefined) {
    return <LoadingAlert />;
  }

  return (
    <div className="mx-auto flex h-full w-5xl flex-col overflow-auto rounded-2xl bg-card p-6 md:max-w-8xl">
      <TabsHeader
        tab={tab}
        setTab={setTab}
        openDescriptionModal={openDescriptionModal}
        setMode={setMode}
      />
      <Tasks
        items={tab === 'ONBOARDING' ? OnboardingData : OffboardingData}
        openDescriptionModal={openDescriptionModal}
        mode={mode}
        setMode={setMode}
      />
      {tab === 'OFFBOARDING' ? (
        <p className="font-light text-xs text-(--muted-foreground) mt-4">
          {offboardingLength} Aufgaben in Offboarding template
        </p>
      ) : (
        <p className="font-light text-xs text-(--muted-foreground) mt-4">
          {onboardingLength} Aufgaben in Onboarding template
        </p>
      )}
      {modalState.selectedItem && modal && (
        <ModalOverlay handleToggle={toggleModal}>
          <TemplateModal
            setModalState={setModalState}
            toggleModal={toggleModal}
            editDescriptionMutation={editDescriptionMutation}
            handleAddSubmitMutation={handleAddSubmitMutation}
            form_field_id={modalState.selectedItem.form_field_id}
            description={modalState.selectedItem.description}
            owner={modalState.selectedItem.owner}
            template_type={tab}
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
