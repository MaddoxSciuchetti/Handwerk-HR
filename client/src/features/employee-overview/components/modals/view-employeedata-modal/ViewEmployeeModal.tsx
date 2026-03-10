import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import ModalOverlay from '@/components/modal/ModalOverlay';
import SmallWrapper from '@/components/modal/modalSizes/SmallWrapper';
import { Spinner } from '@/components/ui/spinner';
import { EmployeeTabsData } from '@/features/employee-overview/components/employees/EmployeeTabsData';
import ReminderModal from '@/features/employee-overview/components/modals/view-employeedata-modal/ReminderModal';
import useEmployeeData from '@/features/employee-overview/hooks/useEmployeeData';

type ViewEmployeeModalProps = {
  selectedOwner: string;
};

const ViewEmployeeModal = ({ selectedOwner }: ViewEmployeeModalProps) => {
  const { setModalOpen, modal, isLoading, cleanData } = useEmployeeData();

  if (isLoading)
    return (
      <CenteredDiv>
        <Spinner className="w-8" />
      </CenteredDiv>
    );

  return (
    <SmallWrapper className="items-stretch justify-start overflow-hidden">
      <div className="flex h-full w-full min-h-0 flex-col p-6">
        <h2 className="mb-4 text-lg font-medium">Aufgaben</h2>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <EmployeeTabsData
            user={selectedOwner}
            cleanData={cleanData}
            data={[]}
            onTaskClick={() => setModalOpen(true)}
          />
        </div>
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
