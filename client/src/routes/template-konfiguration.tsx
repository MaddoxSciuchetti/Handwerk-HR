import DescriptionRoot from "@/features/DescriptionRoot";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/template-konfiguration")({
    component: RouteComponent,
});

function RouteComponent() {
    return <DescriptionRoot />;
}
