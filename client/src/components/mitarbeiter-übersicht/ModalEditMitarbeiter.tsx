import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
    deleteEmployeeHandler,
    DescriptionData,
    editEmployeeAbsence,
    fetchRawDescription,
} from "@/lib/api";
import { subISOWeekYears } from "date-fns";
import { set } from "zod";
import useEmployeeData from "@/hooks/use-employeeData";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

type ModalEditMitarbeiterProps = {
    fullname: string;
    toggleEmployeeModal: () => void;
    id: string | undefined;
};

function ModalEditMitarbeiter({
    fullname,
    toggleEmployeeModal,
    id,
}: ModalEditMitarbeiterProps) {
    const {
        data: descriptionData,
        isLoading,
        isError,
    } = useQuery<DescriptionData>({
        queryKey: ["descriptionData"],
        queryFn: fetchRawDescription,
    });

    const [absence, setAbsence] = useState<string>("");
    const [absencetype, setAbsenceType] = useState<string>();
    const [absencebegin, setAbsenceBegin] = useState<string>();
    const [absenceEnd, setAbsenceEnd] = useState<string>();
    const [substitute, setSubstitute] = useState<string>();

    const {
        mutate: DeleteEmployee,
        error,
        isError: isErrorMutation,
    } = useMutation({
        mutationFn: deleteEmployeeHandler,
        onSuccess: () => {
            toggleEmployeeModal;
        },
        onError: () => {
            console.log(error);
        },
    });

    const {
        mutate: EmployeeAbsence,
        error: ErrorAbsence,
        isError: isErrorAbsence,
    } = useMutation({
        mutationFn: editEmployeeAbsence,
        onSuccess: () => {
            console.log("this was a success");
        },
        onError: () => {
            console.log(ErrorAbsence);
        },
    });

    const {
        EmployeeData,
        isLoading: isLoadingEmployee,
        ErrorEmployee,
        isError: isErrorEmployee,
    } = useEmployeeData();

    console.log("descriptiond data");
    console.log(descriptionData);
    if (isLoading) return <div>Is Loading</div>;
    if (isError) return <div>No error</div>;
    if (!id) return <div>There is no id</div>;

    return (
        <>
            <div className="flex flex-col max-h-100 min-h-140 mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl  w-2xl">
                <div className="max-w-xl h-full w-xl my-10">
                    <Button
                        variant={"outline"}
                        onClick={() => DeleteEmployee(id)}
                    >
                        Delete Mitarbeiter
                    </Button>
                    <div className="flex flex-col gap-5">
                        <Label htmlFor="firstname">
                            Abwesenheit eintragen für {fullname}
                        </Label>

                        <select
                            value={absence}
                            onChange={(e) => setAbsence(e.target.value)}
                        >
                            <option>ja</option>
                            <option>nein</option>
                        </select>

                        <Label>Art der Abwesenheit</Label>
                        <select
                            value={absencetype}
                            onChange={(e) => setAbsenceType(e.target.value)}
                        >
                            <option>Krank</option>
                            <option>Urlaub</option>
                            <option>Andere</option>
                        </select>

                        <Label>Anfang der Abwesenheit</Label>

                        <Input
                            type="text"
                            id="firstname"
                            placeholder="Datum"
                            value={absencebegin}
                            onChange={(e) => setAbsenceBegin(e.target.value)}
                        />

                        <Label>Voraussichtliches Ende der Abwesenheit</Label>

                        <Input
                            type="text"
                            id="firstname"
                            placeholder="Enddatum"
                            value={absenceEnd}
                            onChange={(e) => setAbsenceEnd(e.target.value)}
                        />

                        <Label>Vetretung</Label>

                        <Select
                            value={substitute}
                            onValueChange={(value) => setSubstitute(value)}
                        >
                            <SelectTrigger
                                id="substitute"
                                name="substitute"
                                value={substitute}

                                // className="w-[17.75rem]"
                            >
                                <SelectValue placeholder="Vertretung" />
                            </SelectTrigger>
                            <SelectContent className="border-none">
                                <SelectGroup className="bg-white cursor-pointer">
                                    {EmployeeData?.map((item) => (
                                        <SelectItem
                                            className="hover:bg-gray-200 cursor-pointer"
                                            id={`select-${item.id}`}
                                            value={item.id}
                                            key={item.id}
                                            onClick={() =>
                                                setSubstitute(item.id)
                                            }
                                        >
                                            {item.vorname} {item.nachname}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={() =>
                                EmployeeAbsence({
                                    id,
                                    absence,
                                    absencetype,
                                    absencebegin,
                                    absenceEnd,
                                    substitute,
                                })
                            }
                            variant={"outline"}
                        >
                            Speichern
                        </Button>
                    </div>

                    {descriptionData?.map((value, index) => (
                        <div key={index}></div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default ModalEditMitarbeiter;
