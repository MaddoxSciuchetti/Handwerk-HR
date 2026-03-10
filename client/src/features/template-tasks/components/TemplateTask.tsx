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

  if (OnboardingData === undefined || OffboardingData === undefined) {
    return <LoadingAlert />;
  }

  return (
    <div className="flex flex-col rounded-2xl overflow-x-auto w-full h-full p-6 shadow-gray-200 shadow-lg overflow-auto">
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
