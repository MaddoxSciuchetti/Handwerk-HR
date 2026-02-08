import useAuth from "@/hooks/useAuth";

function Dashboard() {
  const { user, isError, isLoading } = useAuth();

  if (user === undefined) return <div>Not allowed</div>;
  if (isLoading) return <div>Is Loading</div>;

  return <></>;
}

export default Dashboard;
