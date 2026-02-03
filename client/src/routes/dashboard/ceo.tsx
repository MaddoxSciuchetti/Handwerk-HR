import Ceo_Dashboard from "@/features/Ceo_Dashboard";
import useAuth from "@/hooks/useAuth";
import { fetchChefData, user, verifyChef } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/ceo")({
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = useAuth();

  const { data: chefverification } = useQuery<user>({
    queryKey: ["user", user?.id],
    queryFn: () => verifyChef(),
  });

  if (chefverification?.user_permission === "CHEF") {
    return <Ceo_Dashboard />;
  } else {
    return <div>Permission denied</div>;
  }
}
