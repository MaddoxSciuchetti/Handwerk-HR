import { Tabs, TabsContent } from '@/components/ui/tabs';
import { SetStateAction } from 'react';
import { EmployeeWorker } from '../../types/employeeform.types';
import { EmployeeTabsData } from './EmployeeTabsData';

type CeoTabsContentProps = {
  selectedUser: string;
  cleanData: Array<[string, EmployeeWorker]>;
  setModalOpen: (value: SetStateAction<boolean>) => void;
};

function EmployeeTabsContent({
  selectedUser,
  cleanData,
  setModalOpen,
}: CeoTabsContentProps) {
  return (
    <Tabs>
      <TabsContent value={selectedUser} className="mt-10">
        <EmployeeTabsData
          cleanData={cleanData}
          user={selectedUser}
          onTaskClick={() => setModalOpen(true)}
        />
      </TabsContent>
    </Tabs>
  );
}

export default EmployeeTabsContent;
