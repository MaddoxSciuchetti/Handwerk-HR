import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import z, { success } from "zod";
import { API_URL } from "../api";
import Form from "@/components/worker_components/worker_form_data";
import { Mappingform } from "../schemas/Task";
import { APIResponse } from "../types/api_response";
import PreviewComponent from "@/components/worker_components/preivew_component";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import Worker_Backround from "@/components/backround_worker";
import { Input } from "@/components/ui/input";
import { tryCatch } from "@/lib/utils";
import { editData, formattedData } from "@/lib/api";
import { useToggleModal } from "@/hooks/use-toggleModal";

export type form_field = {
    id: number;
    form_field_id: number;
    description: string;
    officialOwner: string;
    substituteOwner: string;
    owner_id: number;
    is_substitute: boolean;
    status: string;
    edit: string;
};

export type api_Response = {
    user: {
        id: number;
        vorname: string;
        nachname: string;
    };
    form: {
        id: number;
        type: string;
        fields: form_field[];
    };
};

const formSchema = z.object({
    id: z.string(),
    editcomment: z.string(),
    select_option: z.string(),
    form_field_id: z.string(),
});

type OffboardingFormProps = {
    id: number;
    search: { param1: string }; // match validateSearch
};

const OnOf_Worker_Procedure: React.FC<OffboardingFormProps> = ({
    id,
    search,
}) => {
    const [modalState, setModalState] = useState<{
        selectedItem: {
            id: number;
            description: string;
            editcomment: string;
            select_option: string;
            form_field_id: number;
        } | null;
    }>({
        selectedItem: null,
    });

    const [descriptionSearch, setDescriptionSearch] = useState<string>("");

    const queryClient = useQueryClient();
    const { modal, setModal, toggleModal } = useToggleModal();

    const [activetab, setActiveTab] = useState<string>("form");

    const { user } = useAuth();

    const { data, error, isLoading, isError } = useQuery<api_Response>({
        queryKey: ["somethingelse", id],
        queryFn: () => fetchFormattedData(),
    });

    if (!data) {
        return <div>Daten Laden</div>;
    }

    const searchData = data.form.fields.filter((field) =>
        field.description
            .toLowerCase()
            .includes(descriptionSearch.toLowerCase()),
    );
    console.log("SEARCH DATA");
    console.log(searchData);

    const sortedData = [...searchData].sort((a, b) => {
        if (a.status === "erledigt" && b.status !== "erledigt") {
            return 1;
        } else if (a.status !== "erledigt" && b.status === "erledigt") {
            return -1;
        } else {
            return 0;
        }
    });

    async function sendFormData(formData: Mappingform): Promise<APIResponse> {
        const url = `${API_URL}/offboarding/editdata`;

        const [result, resultError] = await tryCatch(editData(formData));
        if (resultError) {
            return { success: false, error: resultError.message };
        }
        return { success: true, affectedRows: result.affectedRows };
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        try {
            const formData = new FormData(event.currentTarget);
            const formValues = Object.fromEntries(formData);

            const result = formSchema.safeParse(formValues);

            if (!result.success) {
                console.log("validation errors", result.error);
                return;
            }
            if (!user) {
                console.log("user not authenticated");
                return;
            }

            await insertHistoryData(result.data, user);
            queryClient.invalidateQueries({
                queryKey: ["formHistory", parseInt(result.data.id)],
            });

            const response = await sendFormData(result.data);
            if (response.success === true) {
                await queryClient.invalidateQueries({
                    queryKey: ["somethingelse", id],
                });

                setModalState({ selectedItem: null });
                toggleModal();
            }
        } catch (error) {
            console.log(error);
        }
    }

    async function fetchFormattedData(): Promise<api_Response> {
        const [response, error] = await tryCatch(
            formattedData(id, search.param1),
        );
        if (error) {
            throw new Error("");
        }

        return response;
    }

    async function openEditModal(
        id: number,
        description: string,
        editcomment: string,
        select_option: string,
        form_field_id: number,
    ) {
        toggleModal();
        setModalState({
            selectedItem: {
                id,
                description,
                editcomment,
                select_option,
                form_field_id,
            },
        });
    }

    function closeModal() {
        setModalState({
            selectedItem: null,
        });
        toggleModal();
    }

    type insertHistoryDataType = z.infer<typeof formSchema>;

    type user_verified = {
        createdAt: string;
        email: string;
        id: string;
        updatedAt: string;
        verified: boolean;
    };

    async function insertHistoryData(
        result: insertHistoryDataType,
        user: user_verified,
    ) {
        try {
            const response = await fetch(
                `${API_URL}/offboarding/editHisoryData`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        result,
                        user,
                    }),
                },
            );
            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}` };
            }
            const result_API = await response.json();
            return { success: true, affectedRows: result_API };
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <>
            <div className="flex flex-col w-full h-150 rounded-2xl mx-auto  shadow-gray-200 shadow-lg overflow-auto p-6 md:max-w-8xl md:h-300">
                <div className=" flex justify gap-5">
                    <Input
                        value={descriptionSearch}
                        onChange={(e) => setDescriptionSearch(e.target.value)}
                        placeholder="Search"
                    />
                    <Button
                        variant={"outline"}
                        className={
                            activetab === "form"
                                ? "active bg-gray-200 cursor-pointer"
                                : ""
                        }
                        onClick={() => setActiveTab("form")}
                    >
                        Aufgaben
                    </Button>
                    <Button
                        variant={"outline"}
                        className={
                            activetab === "files"
                                ? "active bg-gray-200 cursor-pointer"
                                : ""
                        }
                        onClick={() => setActiveTab("files")}
                    >
                        Dateien
                    </Button>
                </div>
                <div>
                    {activetab === "files" && <Worker_Backround id={id} />}
                    {activetab === "form" && (
                        <div className="">
                            {modalState.selectedItem && (
                                <div className="fixed inset-0 z-50 flex">
                                    <div
                                        onClick={closeModal}
                                        className="fixed inset-0 bg-black/50 cursor-pointer"
                                        aria-label="Close modal"
                                    />
                                    <PreviewComponent
                                        id={modalState.selectedItem.id}
                                        description={
                                            modalState.selectedItem.description
                                        }
                                        editcomment={
                                            modalState.selectedItem.editcomment
                                        }
                                        select_option={
                                            modalState.selectedItem
                                                .select_option
                                        }
                                        form_field_id={
                                            modalState.selectedItem
                                                .form_field_id
                                        }
                                        handleSubmit={handleSubmit}
                                    />
                                </div>
                            )}

                            {sortedData.map(
                                (field: form_field, index: number) => (
                                    <Form
                                        key={index}
                                        id_original={field.id}
                                        editcomment={field.edit}
                                        select_option={field.status}
                                        description={field.description}
                                        officialOwner={field.officialOwner}
                                        substituteOwner={field.substituteOwner}
                                        owner_id={field.owner_id}
                                        is_substitute={field.is_substitute}
                                        form_field_id={data.form.id}
                                        onEdit={(
                                            id,
                                            description,
                                            editcomment,
                                            select_option,
                                            form_field,
                                        ) =>
                                            openEditModal(
                                                id,
                                                description,
                                                editcomment,
                                                select_option,
                                                form_field,
                                            )
                                        }
                                        handleSubmit={handleSubmit}
                                        // historyResult={historyResult}
                                    />
                                ),
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default OnOf_Worker_Procedure;
