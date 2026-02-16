import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/template-konfiguration")({
    component: RouteComponent,
});

function RouteComponent() {
    return <div>CRUD of the Root layout Document comes here</div>;
}
