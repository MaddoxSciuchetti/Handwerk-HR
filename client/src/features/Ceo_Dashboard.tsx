import AdminModal from "@/components/admin_data/AdminModal";
import { Button } from "@/components/ui/button";
import { EmployFormSchema, fetchChefData } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import z from "zod";

export type TEmployForm = z.infer<typeof EmployFormSchema>;

function Ceo_Dashboard() {
  const {
    data: chefdata,
    isLoading,
    error,
  } = useQuery<TEmployForm>({
    queryKey: ["user"],
    queryFn: fetchChefData,
  });

  const uniqueUser = useMemo(() => {
    if (!chefdata) return [];
    const userMap = new Map<string, TEmployForm[0]>();
    chefdata.forEach((item) => {
      if (!userMap.has(item.owner)) {
        userMap.set(item.owner, item);
      }
    });

    return Array.from(userMap.values());
  }, [chefdata]);

  const [modal, setModalOpen] = useState<boolean>(false);

  console.log(chefdata);

  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const selectUserData = useMemo(
    () => chefdata?.filter((item) => item.owner === selectedUser) || [],
    [selectedUser, chefdata],
  );

  if (isLoading) return <div>Loading</div>;
  if (error) console.log(error);
  return (
    <>
      <div className="flex outline w-4xl h-120 absolute">
        <div className="relative outline w-1/3 h-auto">Content</div>
        <div className="relative outline w-2/3 h-auto">
          <div className="flex outline w-auto h-20 gap-3.5">
            {uniqueUser.map((user) => (
              <div
                key={user.owner}
                onClick={() => setSelectedUser(user.owner)}
                className={`items-center flex flex-row justify-center cursor-pointer p2 ${selectedUser === user.owner ? `bg-blue-200` : `hover:bg-gray-100`}`}
              >
                {user.owner}
              </div>
            ))}
          </div>
          <div className="flex relative outline w-full h-auto">
            {selectedUser ? (
              <div>
                <p>Aktuellen Daten {selectedUser}</p>
                {selectUserData.map((data, index) => (
                  <div
                    key={index}
                    className="outline outline-red-500"
                    onClick={() => setModalOpen(true)}
                  >
                    <div>
                      <p className="">Aufgaben: {data.description}</p>
                    </div>
                    <div key={data.form_field_id} className="border p-2 mb-2">
                      <div className="outline rounded">
                        <p>Zwei offene Formen: </p>
                        {data.inputs.map((input, index) => (
                          <div key={index}>
                            <p key={input.id} className="text-sm">
                              Input: {input.id} Zuletzt bearbeitet:
                              {input.timestamp.toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>Select a user to see their data</div>
            )}
          </div>
        </div>

        {modal && <AdminModal onClose={() => setModalOpen(false)} />}
      </div>
    </>
  );
}

export default Ceo_Dashboard;
