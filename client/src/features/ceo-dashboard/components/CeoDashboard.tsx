import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { Spinner } from '@/components/ui/spinner';
import { Tabs } from '@/components/ui/tabs';
import useCurrentBSBEmployee from '@/features/ceo-dashboard/hooks/useCurrentBSBEmployee';
import useHandwerkerProBSBEmployee from '@/features/ceo-dashboard/hooks/useHandwerkerProBSBEmployee';
import useEmployeeData from '../hooks/useEmployeeData';
import EmployeeTabs from './employees/EmployeeTabs';
import EmployeeTabsContent from './employees/EmployeeTabsContent';
import ReminderModal from './ReminderModal';

function CeoDashboard() {
  const {
    allEmployeeData,
    setSelectedUser,
    setModalOpen,
    modal,
    selectedUser,
    isLoading,
    error,
    cleanData,
  } = useEmployeeData();

  const uniqueHandwerkerProBSBEmployee =
    useHandwerkerProBSBEmployee(allEmployeeData);

  const { currentBSBEmployee } = useCurrentBSBEmployee(
    allEmployeeData,
    selectedUser
  );

  const toggleModal = () => {
    setModalOpen(false);
  };
  if (isLoading)
    return (
      <CenteredDiv>
        <Spinner className="w-8" />
      </CenteredDiv>
    );
  if (error) console.log(error);

  return (
    <>
      <>
        <div className="rounded-2xl overflow-x-auto w-full h-full p-6 shadow-gray-200 shadow-lg overflow-auto">
          <h1 className="mb-5 text-xl font-light ml-6 ">
            Deine Mitarbeiter und ihre offenen Aufgaben
          </h1>
          <Tabs
            defaultValue="account"
            className="ml-6"
            value={selectedUser || undefined}
            onValueChange={(val) => setSelectedUser(val)}
          >
            <EmployeeTabs
              uniqueHandwerkerProBSBEmployee={uniqueHandwerkerProBSBEmployee}
              selectedUser={selectedUser}
            />
            {selectedUser ? (
              <EmployeeTabsContent
                selectedUser={selectedUser}
                cleanData={cleanData}
                currentBSBEmployee={currentBSBEmployee}
                setModalOpen={setModalOpen}
              />
            ) : (
              <h1 className="text-sm font-light">Kein Nutzer ausgewählt</h1>
            )}
          </Tabs>
        </div>

        {modal && (
          <ModalOverlay handleToggle={toggleModal}>
            <ReminderModal onClose={() => toggleModal()} />
          </ModalOverlay>
        )}
      </>
    </>
  );
}

export default CeoDashboard;
