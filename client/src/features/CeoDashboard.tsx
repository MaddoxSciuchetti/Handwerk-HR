import z from 'zod';
import useCeoDashboard from '@/hooks/use-CeoDashboard';
import { Tabs } from '@/components/ui/tabs';
import useHandwerkerProBSBEmployee from '@/hooks/use-unique-user';
import { Spinner } from '@/components/ui/spinner';
import useCurrentBSBEmployee from '@/hooks/use-currentBSBEmployee';
import EmployeeTabsContent from '@/components/ceo-dashboard/EmployeeTabsContent';
import CeoTabs from '@/components/ceo-dashboard/CTabsList';
import Modal from '@/components/ceo-dashboard/CModal';
import { EmployFormSchema } from '@/zod-schemas/schema';

export type TEmployForm = z.infer<typeof EmployFormSchema>;
export type TEmployeFormId = z.infer<typeof EmployFormSchema>[number];

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
  } = useCeoDashboard();

  const uniqueHandwerkerProBSBEmployee =
    useHandwerkerProBSBEmployee(allEmployeeData);

  const { currentBSBEmployee } = useCurrentBSBEmployee(
    allEmployeeData,
    selectedUser
  );

  if (error) console.log(error);

  return (
    <>
      {isLoading ? (
        <Spinner className="size-8" />
      ) : (
        <>
          <div className="rounded-2xl overflow-x-auto w-full h-full p-6 shadow-gray-200 shadow-lg overflow-auto">
            <h1 className="mb-5 text-2xl font-light ml-6 ">
              Deine Mitarbeiter und ihre offenen Aufgaben
            </h1>
            <Tabs
              defaultValue="account"
              className="ml-6"
              value={selectedUser || undefined}
              onValueChange={(val) => setSelectedUser(val)}
            >
              <CeoTabs
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

          <Modal
            modal={modal}
            setModalOpen={setModalOpen}
            selectedUser={selectedUser}
          />
        </>
      )}
    </>
  );
}

export default CeoDashboard;
