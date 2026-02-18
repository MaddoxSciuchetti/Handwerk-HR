import { Button } from "@/components/ui/button";
import { useState } from "react";
import ModalMitarbeiter from "@/components/mitarbeiter-übersicht/ModalMitarbeiter";
import { useSidebar } from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { specificEmployeeData } from "@/lib/api";
import { EditIcon } from "lucide-react";
import ModalEditMitarbeiter from "@/components/mitarbeiter-übersicht/ModalEditMitarbeiter";

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
    } = useQuery({
        queryKey: ["EmployeeDataSpecifics"],
        queryFn: specificEmployeeData,
    });

    if (isLoading) return <div>Is Loading</div>;
    if (isError) return <div>{error?.message}</div>;

    return (
        <>
            <div>
                <Button onClick={toggleModal} variant={"outline"}>
                    Mitarbeiter Hinzufügen
                </Button>

                {EmployeeData?.map((value, index) => (
                    <div key={index}>
                        <div className="flex">
                            <EditIcon
                                onClick={() => {
                                    (toggleEmployeeModal(),
                                        setfirstName(value.vorname));
                                    setlastName(value.nachname);
                                    setIdValue(value.id);
                                    console.log(value.id);
                                }}
                            />
                            {value.vorname} {value.nachname}
                        </div>
                    </div>
                ))}

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
        </>
    );
}

export default MitarbeiterÜbersicht;
