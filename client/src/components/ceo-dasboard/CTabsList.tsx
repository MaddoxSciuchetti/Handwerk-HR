import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TEmployForm } from "@/features/Ceo_Dashboard";

type CeoTabProps = {
    uniqueHandwerkerProBSBEmployee: TEmployForm;
    selectedUser: string | null;
};

function CeoTabs({
    uniqueHandwerkerProBSBEmployee,
    selectedUser,
}: CeoTabProps) {
    return (
        <TabsList
            variant={"default"}
            className="w-full max-w-xs justify-start flex-wrap px-5 gap-5 border-b-2 border-[0.5px] border-gray-700"
        >
            {uniqueHandwerkerProBSBEmployee.map((user, index) => (
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

export default CeoTabs;
