import { signup } from "@/lib/api";

import { useMutation, useQuery } from "@tanstack/react-query";
import useSWR from "swr";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Modal from "@/components/modal/Modal";
import ModalMitarbeiter from "@/components/mitarbeiter-übersicht/ModalMitarbeiter";
import { useSidebar } from "@/components/ui/sidebar";

function MitarbeiterÜbersicht() {
    const [modal, setModal] = useState<boolean>(false);
    const { toggleSidebar } = useSidebar();

    const toggleModal = () => {
        setModal((prev) => !prev);
        toggleSidebar();
    };

    // const {data, isError, isLoading} = useQuery<>({
    //     queryKey: ["createEmployeeData"],
    //     queryFn: fetchEmployeeData
    // })

    return (
        <div>
            <Button onClick={toggleModal} variant={"outline"}>
                Mitarbeiter Hinzufügen
            </Button>

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
    );
}

export default MitarbeiterÜbersicht;
