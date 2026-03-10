import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import ModalOverlay from '@/components/modal/ModalOverlay';
import SmallWrapper from '@/components/modal/modalSizes/SmallWrapper';
import { Spinner } from '@/components/ui/spinner';
import { EmployeeTabsData } from '@/features/ceo-dashboard/components/employees/EmployeeTabsData';
import ReminderModal from '@/features/ceo-dashboard/components/ReminderModal';
import useEmployeeData from '@/features/ceo-dashboard/hooks/useEmployeeData';

type ViewEmployeeModalProps = {
  toggleModal: () => void;
  selectedOwner: string;
};

const ViewEmployeeModal = ({
  toggleModal,
  selectedOwner,
}: ViewEmployeeModalProps) => {
  const { setModalOpen, modal, isLoading, cleanData } = useEmployeeData();

  if (isLoading)
    return (
      <CenteredDiv>
        <Spinner className="w-8" />
      </CenteredDiv>
    );

  return (
    <SmallWrapper className="items-stretch justify-start overflow-hidden">
      <div className="p-6">
        <h2 className="mb-4 text-lg font-medium">Offene Aufgaben</h2>
        <EmployeeTabsData
          user={selectedOwner}
          cleanData={cleanData}
          data={[]}
          onTaskClick={() => setModalOpen(true)}
        />
      </div>

      {modal && (
        <ModalOverlay handleToggle={() => setModalOpen(false)}>
          <ReminderModal onClose={() => setModalOpen(false)} />
        </ModalOverlay>
      )}
    </SmallWrapper>
  );
};

export default ViewEmployeeModal;
