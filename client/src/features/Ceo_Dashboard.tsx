import { AccordionDemo } from "@/components/admin_data/CAccordion";
import AdminModal from "@/components/admin_data/AdminModal";
import { Button } from "@/components/ui/button";
import { EmployFormSchema, fetchChefData } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import z from "zod";
import useCeoDashboard from "@/hooks/useCeoDashboard";

export type TEmployForm = z.infer<typeof EmployFormSchema>;

function Ceo_Dashboard() {
  const {
    chefdata,
    uniqueUsersByOwner,
    setSelectedUser,
    setModalOpen,
    modal,
    selectedUser,
    selectUserData,
    isLoading,
    error,
  } = useCeoDashboard();

  if (isLoading) return <div>Loading</div>;
  if (error) console.log(error);

  return (
    <>
      <div className="flex outline w-4xl h-120 absolute">
        <div className="relative outline w-1/3 h-auto">Content</div>
        <div className="relative outline w-2/3 h-auto ">
          <div className="items-center flex justify-center outline w-full h-20 gap-3.5">
            {uniqueUsersByOwner.map((user) => (
              <div
                key={user.owner}
                onClick={() => setSelectedUser(user.owner)}
                className={`items-center h-5 flex flex-row justify-center cursor-pointer p2 rounded-2xl ${selectedUser === user.owner ? `bg-blue-200` : `hover:bg-gray-100`}`}
              >
                {user.owner}
              </div>
            ))}
          </div>
          <div className="flex flex-col relative outline w-full h-auto">
            {selectedUser ? (
              <div>
                <div
                  className="outline outline-red-500"
                  // onClick={() => setModalOpen(true)}
                >
                  <AccordionDemo
                    data={selectUserData}
                    onTaskClick={() => setModalOpen(true)}
                  />
                </div>
              </div>
            ) : (
              <div>Select a user to see their data</div>
            )}
          </div>
        </div>
      </div>
      {modal && <AdminModal onClose={() => setModalOpen(false)} />}
    </>
  );
}

export default Ceo_Dashboard;
