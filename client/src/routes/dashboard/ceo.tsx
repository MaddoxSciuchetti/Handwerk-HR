import { Spinner } from "@/components/ui/spinner";
import Ceo_Dashboard from "@/features/Ceo_Dashboard";
import useAuth from "@/hooks/useAuth";
import { fetchChefData, user, verifyChef } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/ceo")({
    component: RouteComponent,
});

function RouteComponent() {
    const user = useAuth();

    const {
        data: chefverification,
        isLoading,
        isError,
    } = useQuery<user>({
        queryKey: ["user", user?.user?.id],
        queryFn: () => verifyChef(),
    });

    if (isLoading) {
        return <Spinner className="size-8" />;
    }

    if (isError || !user) {
        return (
            <div className="flex flex-col items-center mt-16 space-y-2">
                <h1 className="text-3xl font-bold">Error loading user</h1>
                <p className="text-red-500">Please try again later</p>
            </div>
        );
    }
    if (chefverification?.user_permission === "CHEF") {
        console.log("VERIED VERFIED ");
        return <Ceo_Dashboard />;
    }
    return <div>Permission denied</div>;
}
