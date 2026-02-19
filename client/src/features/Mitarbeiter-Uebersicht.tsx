import { Button } from "@/components/ui/button";
import { useState } from "react";
import ModalMitarbeiter from "@/components/mitarbeiter-übersicht/ModalMitarbeiter";
import { useSidebar } from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { specificEmployeeData, TEmployeeResponse } from "@/lib/api";
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

    const {
        data: EmployeeData,
        isLoading,
        error,
        isError,
    } = useQuery<TEmployeeResponse>({
        queryKey: ["EmployeeDataSpecifics"],
        queryFn: specificEmployeeData,
    });

    console.log(EmployeeData);

    if (isError) return <div>{error?.message}</div>;

    return (
        <>
            {" "}
            <div className="w-full min-w-340 rounded-2xl mx-auto p-6 shadow-gray-200 shadow-lg overflow-auto md:h-300">
                <div className="h-full flex flex-col">
                    {isLoading && (
                        <div className="flex justify-center mt-16">
                            <h1 className="text-3xl font-bold">
                                Loading user data
                            </h1>
                        </div>
                    )}
                    <div className="flex gap-5">
                        <Input />
                        <div className="flex gap-2">
                            <Button onClick={toggleModal} variant={"outline"}>
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
                                <TableHead className=" pl-0">
                                    Aktionen
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {EmployeeData?.map((value, index) => (
                                <tr
                                    className="hover:bg-gray-50 rounded-2xl cursor-pointer border-seperate border-spacing-y-2 py-5"
                                    onClick={() => {
                                        (toggleEmployeeModal(),
                                            setfirstName(value.vorname));
                                        setlastName(value.nachname);
                                        setIdValue(value.id);
                                        console.log(value.id);
                                    }}
                                >
                                    <td className="text-sm font-semibold py-5">
                                        {value.vorname} {value.nachname}
                                    </td>
                                    <td>
                                        {value.employeeStatus?.map(
                                            (value, index) => (
                                                <div key={index}>
                                                    <p>
                                                        {value.absenceEnd ===
                                                        null
                                                            ? "N/A"
                                                            : value.absenceEnd.getDate()}
                                                    </p>
                                                </div>
                                            ),
                                        )}
                                    </td>
                                    <td>
                                        <EditIcon
                                            className="flex-end"
                                            onClick={() => {
                                                (toggleEmployeeModal(),
                                                    setfirstName(
                                                        value.vorname,
                                                    ));
                                                setlastName(value.nachname);
                                                setIdValue(value.id);
                                                console.log(value.id);
                                            }}
                                        />
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
                            <ModalMitarbeiter />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default MitarbeiterÜbersicht;
