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
      <div className=" w-full max-w-5xl h-150 rounded-2xl mx-auto p-6 shadow-gray-200 shadow-lg overflow-auto">
        <div className="items-center flex justify-center  w-full h-20 gap-3.5">
          {uniqueUsersByOwner.map((user) => (
            <div
              key={user.owner}
              onClick={() => setSelectedUser(user.owner)}
              className={`items-center h-5 flex flex-row justify-center cursor-pointer p2 rounded-2xl ${selectedUser === user.owner ? `underline transition deley-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-105 ` : `hover:bg-gray-100`}`}
            >
              {user.owner}
            </div>
          ))}
        </div>
        <div className="flex flex-col relative  w-full h-auto overflow-auto">
          {selectedUser ? (
            <div>
              <div

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

      {modal && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 bg-black/50 cursor-pointer"
            aria-label="Close modal"
          />
          <AdminModal onClose={() => setModalOpen(false)} />
        </div>
      )}
    </>
  );
}

export default Ceo_Dashboard;
