import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeeWorker } from '../../types/employeeform.types';

type CeoTabProps = {
  uniqueHandwerkerProBSBEmployee: EmployeeWorker;
  selectedUser: string | null;
};

function EmployeeTabs({
  uniqueHandwerkerProBSBEmployee,
  selectedUser,
}: CeoTabProps) {
  return (
    <TabsList
      variant={'default'}
      className="w-full justify-start p px-5 gap-5 border "
    >
      {uniqueHandwerkerProBSBEmployee.map((user) => {
        console.log('the real owner ', user.owner);
        return (
          <TabsTrigger
            value={user?.owner}
            key={user.owner}
            className={`text-md flex cursor-pointer flex-row font-light transition-colors ${selectedUser === user.owner ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
          >
            {user.ownerName}
            {user.isSubstitute && (
              <span className="ml-1 text-xs text-muted-foreground">
                (Vertretung: {user.substituteName})
              </span>
            )}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}

export default EmployeeTabs;
