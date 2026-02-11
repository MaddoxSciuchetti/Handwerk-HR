import OnOf_Home from "@/features/OnOf_Home";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/handwerker")({
    component: RouteComponent,
});
function RouteComponent() {
    return <OnOf_Home />;
}
