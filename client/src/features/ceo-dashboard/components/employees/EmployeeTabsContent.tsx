import { TabsContent } from '@/components/ui/tabs';
import { SetStateAction } from 'react';
import { EmployeeWorker } from '../../types/employeeform.types';
import { EmployeeTabsData } from './EmployeeTabsData';

type CeoTabsContentProps = {
  selectedUser: string;
  cleanData: Array<[string, EmployeeWorker]>;
  currentBSBEmployee: EmployeeWorker;
  setModalOpen: (value: SetStateAction<boolean>) => void;
};

function EmployeeTabsContent({
  selectedUser,
  cleanData,
  currentBSBEmployee,
  setModalOpen,
}: CeoTabsContentProps) {
  return (
    <TabsContent value={selectedUser} className="mt-10">
      <EmployeeTabsData
        cleanData={cleanData}
        user={selectedUser}
        data={currentBSBEmployee}
        onTaskClick={() => setModalOpen(true)}
      />
    </TabsContent>
  );
}

export default EmployeeTabsContent;
