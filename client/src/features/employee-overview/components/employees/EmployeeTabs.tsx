import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeeWorker } from '../../types/employeeform.types';

type CeoTabProps = {
  uniqueResponsibleUsers: EmployeeWorker;
  selectedUser: string | null;
};

function EmployeeTabs({ uniqueResponsibleUsers, selectedUser }: CeoTabProps) {
  return (
    <TabsList
      variant={'default'}
      className="w-full justify-start p px-5 gap-5 border "
    >
      {uniqueResponsibleUsers.map((engagement) => {
        const owner = engagement.responsibleUser;
        return (
          <TabsTrigger
            value={owner.id}
            key={owner.id}
            className={`text-md flex cursor-pointer flex-row font-light transition-colors ${selectedUser === owner.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
          >
            {owner.firstName} {owner.lastName}
            {owner.isAbsent && (
              <span className="ml-1 text-xs text-muted-foreground">
                (Abwesend)
              </span>
            )}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}

export default EmployeeTabs;
