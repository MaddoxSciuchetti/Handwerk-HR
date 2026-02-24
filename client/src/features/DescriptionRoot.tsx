import DescriptionList from '@/components/DescriptionList';
import ModalOverlay from '@/components/modal/ModalOverlay';
import RootModal from '@/components/root_description_layout/RootModal';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import useDescription from '@/hooks/use-description';
import { TABS } from '@/lib/constants';
import { cn } from '@/types/utils';

function DescriptionRoot() {
  const {
    modal,
    modalState,
    openEditModal,
    data,
    deleteDescription,
    handleSubmit,
    handleAddSubmit,
    tab,
    setTab,
    OnboardingData,
    OffboardingData,
    handleOpenModal,
    EmployeeData,
  } = useDescription();

  if (OnboardingData === undefined || OffboardingData === undefined) {
    return <Spinner className="size-8" />;
  }

  return (
    <div className="rounded-2xl overflow-x-auto w-full h-full p-6 shadow-gray-200 shadow-lg overflow-auto">
      <div className="h-full w-full flex flex-col">
        <div className="flex gap-2  justify-center  ">
          {TABS.map(({ value, label }) => (
            <Button
              key={value}
              variant={tab === value ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer',
                tab === value ? 'bg-gray-500 text-white' : 'bg-gray-200'
              )}
              onClick={() => setTab(value)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="flex flex-col">
          <DescriptionList
            items={tab === 'ONBOARDING' ? OnboardingData : OffboardingData}
            handleSubmit={handleSubmit}
            deleteDescription={deleteDescription}
            openEditModal={openEditModal}
          />
        </div>

        {modalState.selectedItem && modal && (
          <ModalOverlay handleToggle={handleOpenModal}>
            <RootModal
              data={data}
              form_field_id={modalState.selectedItem.form_field_id}
              description={modalState.selectedItem.description}
              owner={modalState.selectedItem.owner}
              handleSubmit={handleSubmit}
              handleAddSubmit={handleAddSubmit}
              template_type={tab}
              EmployeeData={EmployeeData}
              OnboardingData={OnboardingData}
              OffboardingData={OffboardingData}
            />
          </ModalOverlay>
        )}
      </div>
    </div>
  );
}

export default DescriptionRoot;
