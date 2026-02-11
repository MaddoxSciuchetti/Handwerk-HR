import { createFileRoute } from "@tanstack/react-router";
import OnOf_Worker_Procedure from "@/features/OnOf_Worker_Procedure";
export const Route = createFileRoute("/user/$Id")({
    validateSearch: (search) => ({
        param1: search.param1 || "",
    }),
    component: UserPage,
});
function UserPage() {
    const { Id } = Route.useParams();
    let id = parseInt(Id);
    const search = Route.useSearch();
    return <OnOf_Worker_Procedure id={id} search={search}/>;
}
