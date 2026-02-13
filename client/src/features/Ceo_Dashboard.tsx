import { AccordionDemo } from "@/components/admin_data/CAccordion";
import AdminModal from "@/components/admin_data/AdminModal";
import { Button } from "@/components/ui/button";
import { EmployFormSchema, fetchChefData } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import z from "zod";
import useCeoDashboard from "@/hooks/useCeoDashboard";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type TEmployForm = z.infer<typeof EmployFormSchema>;
export type TEmployeFormId = z.infer<typeof EmployFormSchema>[number];

function Ceo_Dashboard() {
    const {
        allEmployeeData,
        uniqueHandwerkerProBSBEmployee,
        setSelectedUser,
        setModalOpen,
        modal,
        selectedUser,
        currentBSBEmployee,
        isLoading,
        error,
        cleanData,
    } = useCeoDashboard();

    if (isLoading) return <div>Loading</div>;
    if (error) console.log(error);
    if (isLoading) {
        return (
            <div className="flex justify-center mt-16">
                <h1 className="text-3xl font-bold">Loading user data</h1>
            </div>
        );
    }

    return (
        <>
            <div className="w-full h-150 rounded-2xl mx-auto p-6 shadow-gray-200 shadow-lg overflow-auto md:max-w-8xl md:h-300">
                <h1 className="mb-5 text-2xl font-light ml-6 ">
                    Deine Mitarbeiter und ihre offenen Aufgaben
                </h1>
                <div className=" flex w-full content-start">
                    <Tabs
                        defaultValue="account"
                        className="w-xl ml-6 "
                        value={selectedUser || undefined}
                        onValueChange={(val) => setSelectedUser(val)}
                    >
                        <TabsList
                            variant={"default"}
                            className="w-full justify-start px-5 gap-5 border-b-2 border-[0.5px] border-gray-700"
                        >
                            {uniqueHandwerkerProBSBEmployee.map(
                                (user, index) => (
                                    <TabsTrigger
                                        value={user.owner}
                                        key={user.owner}
                                        className={`text-md flex flex-row  cursor-pointer  ${selectedUser === user.owner ? ` transition delay-150 duration-300 ease-in-out  bg-gray-50` : `hover:bg-gray-50`}`}
                                    >
                                        {user.owner}
                                    </TabsTrigger>
                                ),
                            )}
                        </TabsList>
                        {selectedUser ? (
                            <TabsContent value={selectedUser} className="">
                                <AccordionDemo
                                    cleanData={cleanData}
                                    user={selectedUser}
                                    data={currentBSBEmployee}
                                    onTaskClick={() => setModalOpen(true)}
                                />
                            </TabsContent>
                        ) : (
                            <h1 className="text-sm font-light">
                                Kein Nutzer ausgewählt
                            </h1>
                        )}
                        <TabsContent value="password">
                            Change your password here.
                        </TabsContent>
                    </Tabs>
                </div>
                <div className="flex flex-col relative  w-full h-auto overflow-auto"></div>
            </div>

            {modal && (
                <div className="fixed inset-0 z-50 flex">
                    <div
                        onClick={() => setModalOpen(false)}
                        className="fixed inset-0 bg-black/50 cursor-pointer"
                        aria-label="Close modal"
                    />
                    <AdminModal
                        onClose={() => setModalOpen(false)}
                        selectedUser={selectedUser}
                    />
                </div>
            )}
        </>
    );
}

export default Ceo_Dashboard;
