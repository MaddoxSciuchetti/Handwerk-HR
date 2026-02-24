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
import useHandwerkerProBSBEmployee from "@/hooks/use-unique-user";
import { Spinner } from "@/components/ui/spinner";

export type TEmployForm = z.infer<typeof EmployFormSchema>;
export type TEmployeFormId = z.infer<typeof EmployFormSchema>[number];

function Ceo_Dashboard() {
    const {
        allEmployeeData,
        setSelectedUser,
        setModalOpen,
        modal,
        selectedUser,
        isLoading,
        error,
        cleanData,
    } = useCeoDashboard();

    console.log("clean data");
    console.log(cleanData);

    const uniqueHandwerkerProBSBEmployee =
        useHandwerkerProBSBEmployee(allEmployeeData);
    console.log("unique users by auth_id");
    console.log(uniqueHandwerkerProBSBEmployee);

    const currentBSBEmployee = useMemo(
        () =>
            allEmployeeData?.filter((item) => item.owner === selectedUser) ||
            [],
        [selectedUser, allEmployeeData],
    );
    console.log("current BSB Employee Data:");
    console.log(currentBSBEmployee);

    if (error) console.log(error);

    return (
        <>
            {isLoading ? (
                <Spinner className="size-8" />
            ) : (
                <>
                    <div className="rounded-2xl overflow-x-auto w-full h-full p-6 shadow-gray-200 shadow-lg overflow-auto">
                        <h1 className="mb-5 text-2xl font-light ml-6 ">
                            Deine Mitarbeiter und ihre offenen Aufgaben
                        </h1>
                        <Tabs
                            defaultValue="account"
                            className="ml-6"
                            value={selectedUser || undefined}
                            onValueChange={(val) => setSelectedUser(val)}
                        >
                            <TabsList
                                variant={"default"}
                                className="w-full max-w-xs justify-start flex-wrap px-5 gap-5 border-b-2 border-[0.5px] border-gray-700"
                            >
                                {uniqueHandwerkerProBSBEmployee.map(
                                    (user, index) => (
                                        <TabsTrigger
                                            value={user?.owner}
                                            key={user.owner}
                                            className={`text-md flex flex-row  cursor-pointer  ${selectedUser === user.owner ? ` transition delay-150 duration-300 ease-in-out  bg-gray-100` : `hover:bg-gray-50`}`}
                                        >
                                            {user.original_owner}
                                            {user.is_substitute && (
                                                <span className="text-xs text-gray-400  ml-1">
                                                    (Vertretung:{" "}
                                                    {user.substitute_name})
                                                </span>
                                            )}
                                        </TabsTrigger>
                                    ),
                                )}
                            </TabsList>
                            {selectedUser ? (
                                <TabsContent
                                    value={selectedUser}
                                    className="mt-10"
                                >
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
            )}
        </>
    );
}

export default Ceo_Dashboard;
