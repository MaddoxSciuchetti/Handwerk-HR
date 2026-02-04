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
  console.log("this is the user", user);

  const {
    data: chefverification,
    isLoading,
    isError,
  } = useQuery<user>({
    queryKey: ["user", user?.id],
    queryFn: () => verifyChef(),
  });

  if (isLoading) return <div>Loading</div>;
  if (isError) return <div>Unexpected Error occured</div>;
  if (chefverification?.user_permission === "CHEF") {
    return <Ceo_Dashboard />;
  }
  return <div>Permission denied</div>;
}
