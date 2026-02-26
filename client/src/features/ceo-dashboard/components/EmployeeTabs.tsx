import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TEmployForm } from '../types/employeeform.type';

type CeoTabProps = {
  uniqueHandwerkerProBSBEmployee: TEmployForm;
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
      {uniqueHandwerkerProBSBEmployee.map((user) => (
        <TabsTrigger
          value={user?.owner}
          key={user.owner}
          className={`text-md flex flex-row  cursor-pointer  ${selectedUser === user.owner ? ` transition delay-150 duration-300 ease-in-out  bg-gray-100` : `hover:bg-gray-50`}`}
        >
          {user.original_owner}
          {user.is_substitute && (
            <span className="text-xs text-gray-400  ml-1">
              (Vertretung: {user.substitute_name})
            </span>
          )}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

export default EmployeeTabs;
