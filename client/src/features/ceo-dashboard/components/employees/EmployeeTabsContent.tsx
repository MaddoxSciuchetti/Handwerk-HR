import { TabsContent } from '@/components/ui/tabs';
import { SetStateAction } from 'react';
import { TEmployForm } from '../../types/employeeform.type';
import { EmployeeTabsData } from './EmployeeTabsData';

type CeoTabsContentProps = {
  selectedUser: string;
  cleanData: Array<[string, TEmployForm]>;
  currentBSBEmployee: TEmployForm;
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
