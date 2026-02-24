import RootModal from "@/components/root_description_layout/RootModal";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import useEmployeeData from "@/hooks/use-employeeData";
import { useToggleModal } from "@/hooks/use-toggleModal";
import {
    addDescriptionData,
    addExtraField,
    deleteDescriptionData,
    editTaskData,
    fetchTaskData,
    TDescriptionData,
    TDescriptionResponse,
} from "@/lib/api";
import { tryCatch } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import z from "zod";

function DescriptionRoot() {
    const [modal, setModal] = useState(false);
    const queryClient = useQueryClient();

    const [dataAvailableOnboarding, setDataAvailableOnboarding] = useState<
        boolean | undefined
    >();
    const [dataAvailableOffboarding, setDataAvailableOffboarding] = useState<
        boolean | undefined
    >();

    const [modalState, setModalState] = useState<{
        selectedItem: {
            form_field_id: number | null | undefined;
            description: string | null | undefined;
            owner: string | null | undefined;
        } | null;
    }>({
        selectedItem: null,
    });

    const toggleModal = () => {
        setModal((prev) => !prev);
    };

    async function openEditModal(
        description?: string | null,
        owner?: string,
        form_field_id?: number,
    ) {
        toggleModal();
        setModalState({
            selectedItem: {
                form_field_id,
                description,
                owner,
            },
        });
    }

    function closeModal() {
        setModalState({
            selectedItem: null,
        });
        toggleModal();
    }

    const { data, error } = useQuery<TDescriptionResponse[]>({
        queryKey: ["description_root"],
        queryFn: fetchTaskData,
    });

    const { mutate: deleteDescription } = useMutation({
        mutationFn: deleteDescriptionData,
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["description_root"] }),
    });

    const { mutate: editDescription, error: editError } = useMutation({
        mutationFn: editTaskData,
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["description_root"] }),
    });

    const { mutate: addDescripton, error: addError } = useMutation({
        mutationFn: addDescriptionData,
    });

    const formSchema = z.object({
        form_field_id: z.coerce.number(),
        description: z.string(),
        owner: z.string(),
    });

    const formSchemaWithType = formSchema
        .extend({
            template_type: z.enum(["ONBOARDING", "OFFBOARDING"]),
        })
        .omit({ form_field_id: true });

    async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        try {
            const formData = new FormData(event.currentTarget);
            const formValues = Object.fromEntries(formData);
            console.log("raw form values", formValues);
            const result = formSchema.safeParse(formValues);

            if (!result.success) {
                console.log("validation errors", result.error);
                return;
            }

            console.log("validated data", result.data);

            editDescription(result.data);
            if (!editError) {
                setModalState({ selectedItem: null });
                toggleModal();
            }
        } catch (error) {
            console.log(error);
        }
    }

    async function handleAddSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        try {
            const formData = new FormData(event.currentTarget);
            const formValues = Object.fromEntries(formData);
            console.log("raw form values", formValues);
            const result = formSchemaWithType.safeParse(formValues);

            if (!result.success) {
                console.log("validation errors", result.error);
                return;
            }

            console.log("validated data", result.data);

            // await addDescriptionData(result.data);
            await addExtraField(result.data);
            queryClient.invalidateQueries({ queryKey: ["description_root"] });
            toggleModal();
        } catch (error) {
            console.log(error);
        }
    }

    const { EmployeeData, isLoading, ErrorEmployee, isError } =
        useEmployeeData();

    const [tab, setTab] = useState<"ONBOARDING" | "OFFBOARDING">("ONBOARDING");
    const OnboardingData = data?.filter(
        (value) => value.template_type === "ONBOARDING",
    );
    const OffboardingData = data?.filter(
        (value) => value.template_type === "OFFBOARDING",
    );

    if (OnboardingData === undefined || OffboardingData === undefined) {
        return <Spinner className="size-8" />;
    }

    return (
        <>
            <div className="rounded-2xl overflow-x-auto w-full h-full p-6 shadow-gray-200 shadow-lg overflow-auto">
                <div className="h-full w-full flex flex-col">
                    <div className="flex gap-2  justify-center  ">
                        <Button
                            variant={
                                tab === "ONBOARDING" ? "default" : "outline"
                            }
                            className={` ${
                                tab === "ONBOARDING"
                                    ? "bg-gray-500 text-white cursor-pointer"
                                    : "bg-gray-200 cursor-pointer"
                            } `}
                            onClick={() => setTab("ONBOARDING")}
                        >
                            Onboarding
                        </Button>
                        <Button
                            variant={
                                tab === "OFFBOARDING" ? "default" : "outline"
                            }
                            className={`${
                                tab === "OFFBOARDING"
                                    ? "bg-gray-500 text-white cursor-pointer"
                                    : "bg-gray-200 cursor-pointer"
                            } `}
                            onClick={() => setTab("OFFBOARDING")}
                        >
                            Offboarding
                        </Button>
                    </div>

                    <div className="   flex flex-col  ">
                        {tab === "ONBOARDING" ? (
                            OnboardingData?.length > 0 ? (
                                OnboardingData?.map((item, index) => (
                                    <div
                                        className="hover:scale-100 "
                                        key={index}
                                    >
                                        <div className="justify-center items-center hover:scale-100 mt-10">
                                            <form
                                                className="flex flex-col  "
                                                onSubmit={handleSubmit}
                                                name="valuesform"
                                            >
                                                <div className="flex flex-col gap-5">
                                                    <div className="flex flex-row mt-2">
                                                        <img
                                                            onClick={() =>
                                                                deleteDescription(
                                                                    item.form_field_id,
                                                                )
                                                            }
                                                            src="/assets/x_delete.svg"
                                                            alt="deleticon"
                                                            className="items-center cursor-pointer"
                                                        />
                                                        <div className="ml-5">
                                                            <p className="w-sm underline">
                                                                {
                                                                    item.description
                                                                }
                                                            </p>
                                                        </div>
                                                        <div className="w-full">
                                                            <span className="rounded-2xl bg-gray-100 px-3 py-1 text-sm cursor-pointer group">
                                                                {
                                                                    item
                                                                        .auth_user
                                                                        .vorname
                                                                }{" "}
                                                                {
                                                                    item
                                                                        .auth_user
                                                                        .nachname
                                                                }
                                                            </span>
                                                        </div>

                                                        <img
                                                            className="cursor-pointer"
                                                            src="/assets/editReact.svg"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    item.description,
                                                                    item.owner,
                                                                    item.form_field_id,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <Button
                                    variant={"outline"}
                                    onClick={() => {
                                        openEditModal();
                                        setDataAvailableOnboarding(true);
                                    }}
                                >
                                    Aufgabe Hinzufügen
                                </Button>
                            )
                        ) : OffboardingData?.length > 0 ? (
                            OffboardingData?.map((item, index) => (
                                <div className="hover:scale-100 " key={index}>
                                    <div className="justify-center items-center hover:scale-100 mt-10">
                                        <form
                                            className="flex flex-col  "
                                            onSubmit={handleSubmit}
                                            name="valuesform"
                                        >
                                            <div className="flex flex-col gap-5">
                                                <div className="flex flex-row mt-2">
                                                    <img
                                                        onClick={() =>
                                                            deleteDescription(
                                                                item.form_field_id,
                                                            )
                                                        }
                                                        src="/assets/delete.svg"
                                                        alt="deleticon"
                                                        className="items-center"
                                                    />
                                                    <div className="ml-5">
                                                        <p className="w-sm underline">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                    <div className="w-full">
                                                        <span className="rounded-2xl bg-gray-100 px-3 py-1 text-sm cursor-pointer group">
                                                            {
                                                                item.auth_user
                                                                    .vorname
                                                            }{" "}
                                                            {
                                                                item.auth_user
                                                                    .nachname
                                                            }
                                                        </span>
                                                    </div>

                                                    <img
                                                        src="/assets/editReact.svg"
                                                        onClick={() =>
                                                            openEditModal(
                                                                item.description,
                                                                item.owner,
                                                                item.form_field_id,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <Button
                                variant={"outline"}
                                onClick={() => {
                                    openEditModal();
                                    setDataAvailableOffboarding(true);
                                }}
                            >
                                Aufgabe Hinzufügen
                            </Button>
                        )}
                    </div>

                    {modalState.selectedItem && modal && (
                        <div className="fixed inset-0 z-50 flex">
                            <div
                                onClick={toggleModal}
                                className="fixed inset-0 bg-black/50 cursor-pointer"
                                aria-label="Close modal"
                            />
                            <RootModal
                                data={data}
                                form_field_id={
                                    modalState.selectedItem.form_field_id
                                }
                                description={
                                    modalState.selectedItem.description
                                }
                                owner={modalState.selectedItem.owner}
                                handleSubmit={handleSubmit}
                                handleAddSubmit={handleAddSubmit}
                                template_type={tab}
                                EmployeeData={EmployeeData}
                                dataAvailableOnboarding={
                                    dataAvailableOnboarding
                                }
                                dataAvailableOffboarding={
                                    dataAvailableOffboarding
                                }
                                setDataAvailableOnboarding={
                                    setDataAvailableOnboarding
                                }
                                setDataAvailableOffboarding={
                                    setDataAvailableOffboarding
                                }
                                OnboardingData={OnboardingData}
                                OffboardingData={OffboardingData}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default DescriptionRoot;
