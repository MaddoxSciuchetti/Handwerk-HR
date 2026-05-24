import { Tabs, TabsContent } from '@/components/ui/tabs';
import { SetStateAction } from 'react';
import { WorkerEngagement } from '../../schemas/employeeform.schemas';
import { EmployeeTabsData } from './EmployeeTabsData';

type CeoTabsContentProps = {
  selectedUser: string;
  tasksByEmployee: Array<[string, WorkerEngagement[]]>;
  setModalOpen: (value: SetStateAction<boolean>) => void;
};

function EmployeeTabsContent({
  selectedUser,
  tasksByEmployee,
  setModalOpen,
}: CeoTabsContentProps) {
  return (
    <Tabs>
      <TabsContent value={selectedUser} className="mt-10">
        <EmployeeTabsData
          tasksByEmployee={tasksByEmployee}
          user={selectedUser}
          onTaskClick={() => setModalOpen(true)}
        />
      </TabsContent>
    </Tabs>
  );
}

export default EmployeeTabsContent;
