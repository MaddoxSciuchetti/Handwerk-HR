import { createFileRoute } from "@tanstack/react-router";
import OnOf_Worker_Procedure from "@/features/OnOf_Worker_Procedure";

export const Route = createFileRoute("/user/$Id")({
  validateSearch: (search: Record<string, unknown>) => ({
    param1: (search.param1 as string) || "",
  }),
  component: UserPage,
});

function UserPage() {
  const Id = +Route.useParams();

  const search = Route.useSearch();

  return <OnOf_Worker_Procedure id={Id} search={search} />;
}
