import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import ModalMitarbeiter from "@/components/mitarbeiter-übersicht/ModalMitarbeiter";
import { useSidebar } from "@/components/ui/sidebar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    deleteEmployeeHandler,
    specificEmployeeData,
    TEmployeeResponse,
} from "@/lib/api";
import { EditIcon } from "lucide-react";
import ModalEditMitarbeiter from "@/components/mitarbeiter-übersicht/ModalEditMitarbeiter";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";

function MitarbeiterÜbersicht() {
    const [modal, setModal] = useState<boolean>(false);
    const [editEmployeeModal, setEditEmplyoeeModal] = useState<boolean>(false);
    const [name, setfirstName] = useState<string>("");
    const [lastname, setlastName] = useState<string>("");
    const { toggleSidebar } = useSidebar();
    const fullname = name + lastname;
    const [idvalue, setIdValue] = useState<string>();

    const toggleModal = () => {
        setModal((prev) => !prev);
        toggleSidebar();
    };

    const toggleEmployeeModal = () => {
        setEditEmplyoeeModal((prev) => !prev);
        toggleSidebar();
    };

    const queryClient = useQueryClient();

    const {
        data: EmployeeData,
        isLoading,
        error,
        isError,
    } = useQuery<TEmployeeResponse>({
        queryKey: ["EmployeeDataSpecifics"],
        queryFn: specificEmployeeData,
    });

    const {
        mutate: DeleteEmployee,
        error: errorMutation,
        isError: isErrorMutation,

        isPending,
    } = useMutation({
        mutationFn: deleteEmployeeHandler,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["EmployeeDataSpecifics"],
            });
            toggleEmployeeModal;
        },
        onError: () => {
            console.log(errorMutation);
        },
    });

    console.log("EMPLOYEE DATA");
    console.log(EmployeeData);

    const dateObject = new Date(Date.now());
    const calculateData = (
        firstDate: Date,
        secondDate: Date,
        dateObject: Date,
    ) => {
        if (firstDate && secondDate <= dateObject) {
            return false;
        } else {
            return true;
        }
    };

    if (isPending) return <Spinner className="size-8" />;
    if (isError) return <div>{error?.message}</div>;
    if (!EmployeeData) return <Spinner className="sze-8" />;

    return (
        <>
            {" "}
            <div className="rounded-2xl overflow-x-auto w-full h-full p-6 shadow-gray-200 shadow-lg overflow-auto">
                <div className="h-full w-full flex flex-col">
                    {isLoading && <Spinner className="size-8" />}
                    <div className="flex gap-5">
                        <Input placeholder="Suche bei Namen" />
                        <div className="flex gap-2">
                            <Button
                                className="cursor-pointer"
                                onClick={toggleModal}
                                variant={"outline"}
                            >
                                Mitarbeiter Hinzufügen
                            </Button>
                        </div>
                    </div>

                    <Table className=" text-left mt-5">
                        <TableHeader className="">
                            <TableRow className="text-lg">
                                <TableHead className="text-left  pl-0">
                                    Meine Mitarbeiter
                                </TableHead>
                                <TableHead className="text-left">
                                    Status
                                </TableHead>
                                <TableHead>Vertetung</TableHead>
                                <TableHead className=" pl-0">
                                    Aktionen
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {EmployeeData?.map((value, index) => (
                                <tr
                                    className="hover:bg-gray-50 rounded-2xl cursor-pointer border-seperate border-spacing-y-2 py-5"
                                    key={index}
                                    onClick={() => {
                                        (toggleEmployeeModal(),
                                            setfirstName(value.vorname));
                                        setlastName(value.nachname);
                                        setIdValue(value.id);
                                    }}
                                >
                                    <td className="text-sm font-semibold py-5">
                                        {value.user_permission === "CHEF" ? (
                                            <p>
                                                <span className="text-blue-400">
                                                    Ich:
                                                </span>{" "}
                                                {""}
                                                {value.vorname} {value.nachname}
                                            </p>
                                        ) : (
                                            <p>
                                                {value.vorname}
                                                {value.nachname}
                                            </p>
                                        )}
                                    </td>
                                    {(value.employeeStatus?.length ?? 0) > 0 ? (
                                        value.employeeStatus?.map((status) => (
                                            <td key={status.id} className="">
                                                <div className="flex flex-col">
                                                    {calculateData(
                                                        new Date(
                                                            status.absencebegin ||
                                                                "",
                                                        ),
                                                        new Date(
                                                            status.absenceEnd ||
                                                                "",
                                                        ),
                                                        dateObject,
                                                    ) && status.substitute ? (
                                                        <>
                                                            <p className="text-sm text-red-500 w-full">
                                                                Abwesend vom
                                                            </p>
                                                            <div className="flex gap-1 text-sm">
                                                                {status.absencebegin?.toLocaleDateString(
                                                                    "de-DE",
                                                                    {
                                                                        day: "2-digit",
                                                                        month: "2-digit",
                                                                        year: "2-digit",
                                                                    },
                                                                )}
                                                                <p>bis</p>
                                                                {status.absenceEnd?.toLocaleDateString(
                                                                    "de-DE",
                                                                    {
                                                                        day: "2-digit",
                                                                        month: "2-digit",
                                                                        year: "2-digit",
                                                                    },
                                                                )}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <p className="text-sm text-green-500 w-full">
                                                            Anwesend
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                        ))
                                    ) : (
                                        <td
                                            key={`preent-${value.id}`}
                                            className=""
                                        >
                                            <div className="flex flex-col">
                                                <p className="text-sm text-green-500 w-full">
                                                    Anwesend
                                                </p>
                                            </div>
                                        </td>
                                    )}

                                    <td>
                                        {(value.employeeStatus?.length ?? 0) >
                                        0 ? (
                                            value.employeeStatus?.map(
                                                (value, index) => (
                                                    <div
                                                        className="flex gap-1 "
                                                        key={index}
                                                    >
                                                        {calculateData(
                                                            new Date(
                                                                value.absencebegin ||
                                                                    "",
                                                            ),
                                                            new Date(
                                                                value.absenceEnd ||
                                                                    "",
                                                            ),
                                                            dateObject,
                                                        ) ? (
                                                            <div>
                                                                <span>
                                                                    {
                                                                        value
                                                                            .sub_user
                                                                            ?.vorname
                                                                    }
                                                                </span>{" "}
                                                                <span>
                                                                    {
                                                                        value
                                                                            .sub_user
                                                                            ?.nachname
                                                                    }
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span>n/a</span>
                                                        )}
                                                    </div>
                                                ),
                                            )
                                        ) : (
                                            <>
                                                <span>n/a</span>
                                            </>
                                        )}
                                    </td>

                                    <td>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <img
                                                    className="hover:scale-110"
                                                    src="/assets/editReact.svg"
                                                />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                className={`w-40 bg-gray-100`}
                                                align="start"
                                            >
                                                <DropdownMenuGroup>
                                                    {value.user_permission ===
                                                    "CHEF" ? (
                                                        <DropdownMenuItem
                                                            disabled
                                                            className="hover:bg-gray-200 cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                DeleteEmployee(
                                                                    value.id,
                                                                );
                                                            }}
                                                        >
                                                            Löschen
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            className="hover:bg-gray-200 cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                DeleteEmployee(
                                                                    value.id,
                                                                );
                                                            }}
                                                        >
                                                            Löschen
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </TableBody>
                    </Table>
                    {editEmployeeModal && (
                        <div className="fixed inset-0 z-50 flex">
                            <div
                                onClick={toggleEmployeeModal}
                                className="fixed inset-0 bg-black/50 cursor-pointer"
                                aria-label="Close modal"
                            />
                            <ModalEditMitarbeiter
                                fullname={fullname}
                                toggleEmployeeModal={toggleEmployeeModal}
                                id={idvalue}
                            />
                        </div>
                    )}

                    {modal && (
                        <div className="fixed inset-0 z-50 flex">
                            <div
                                onClick={toggleModal}
                                className="fixed inset-0 bg-black/50 cursor-pointer"
                                aria-label="Close modal"
                            />
                            <ModalMitarbeiter toggleModal={toggleModal} />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default MitarbeiterÜbersicht;
