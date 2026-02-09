import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Modal from "@/components/modal/Modal";
import { useNavigate } from "@tanstack/react-router";
import { FormInputs } from "@/schemas/zodSchema";
import { deleteTaskApi, fetchNameData, postOffboardingData } from "@/lib/api";
import { useSidebar } from "@/components/ui/sidebar";
import SearchHeader from "@/components/SearchHeader";
import HandwerkerTable from "@/components/HandwerkerTable";
import { delete_user } from "@/types/api_response";

type FormType = "Onboarding" | "Offboarding";

type EmployeeForm = {
    form_type: FormType;
};

export type OffboardingItem = {
    employee_forms: EmployeeForm[];
    id: number;
    nachname: string;
    vorname: string;
};

function OnOf_Home() {
    const navigate = useNavigate({ from: "/" });
    const queryClient = useQueryClient();
    const { toggleSidebar } = useSidebar();
    const [modal, setModal] = useState<boolean>(false);
    const [search, setSearch] = useState("");

    const { data, error, isSuccess } = useQuery<OffboardingItem[]>({
        queryKey: ["offboarding"],
        queryFn: fetchNameData,
    });

    const filtered = data?.filter((item) =>
        item.vorname.toLowerCase().includes(search.toLowerCase()),
    );

    const deleteTask = async (taskId: number): Promise<delete_user> => {
        const response = await deleteTaskApi(taskId);
        return response;
    };

    const deleteTaskMutation = useMutation({
        mutationFn: deleteTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["offboarding"] });
        },
    });

    const onSubmit = useMutation({
        mutationFn: async (data: FormInputs) => {
            const response = await postOffboardingData(data);
            return response;
        },
        onSuccess: async (response) => {
            if (response.success) {
                await queryClient.invalidateQueries({
                    queryKey: ["offboarding"],
                    refetchType: "all",
                });
                toggleModal();
            }
        },
        onError: (error) => {
            throw new Error(
                "Fehler beim Hinzufügen des Mitarbeiters: " + error,
            );
        },
    });

    const handleNavigate = (taskId: number, form_type: string) => {
        navigate({
            to: "/user/$Id",
            params: { Id: String(taskId) },
            search: { param1: form_type },
        });
    };

    const getFirstFormType = (item: OffboardingItem) => {
        return item.employee_forms[0]?.form_type;
    };
    const toggleModal = () => {
        setModal((prev) => !prev);
        toggleSidebar();
    };
    return (
        <div className="w-full max-w-5xl h-150 rounded-2xl mx-auto p-6 shadow-gray-200 shadow-lg">
            <div className="h-full flex flex-col ">
                <SearchHeader
                    toggleModal={toggleModal}
                    search={search}
                    setSearch={setSearch}
                />
                <HandwerkerTable
                    filtered={filtered}
                    form_type={getFirstFormType}
                    onRemove={deleteTaskMutation.mutate}
                    gotopage={handleNavigate}
                />
            </div>

            {error && <div>Error: {error.message}</div>}
            {isSuccess && data.length === 0 && <div>Keine Daten gefunden.</div>}

            {modal && (
                <div className="fixed inset-0 z-50 flex">
                    <div
                        onClick={toggleModal}
                        className="fixed inset-0 bg-black/50 cursor-pointer"
                        aria-label="Close modal"
                    />
                    <Modal className="p-4 rounded-lg" onSuccess={onSubmit} />
                </div>
            )}
        </div>
    );
}

export default OnOf_Home;
