import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/trycatch';
import { TABS } from '../consts/index.consts';
import useEditDescription from '../hooks/useEditDescription';
import useFetchTask from '../hooks/useFetchTask';
import useGetDescription from '../hooks/useGetDescription';
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
      <div className="flex gap-2 justify-start">
        {TABS.map(({ value, label }) => (
          <Button
            key={value}
            variant={'outline'}
            className={cn(
              'cursor-pointer rounded-xl bg-white font-light',
              tab === value ? 'bg-gray-200' : 'bg-white'
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
