import MitarbeiterÜbersicht from "@/features/Mitarbeiter-Uebersicht";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/mitarbeiter-uebersicht")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <div className="flex">
                <div>
                    1. Mitarbeiter Erstellung 2. Mitarbeiter Krank stellen 3. Am
                    Ende irgendwie Verbinden
                </div>
                <MitarbeiterÜbersicht />
            </div>
        </>
    );
}
