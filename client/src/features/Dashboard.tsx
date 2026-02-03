import useAuth from "@/hooks/useAuth";

function Dashboard() {
  const { user, isError } = useAuth();

  return (
    <>
      <div>worker data</div>
    </>
  );
}

export default Dashboard;
