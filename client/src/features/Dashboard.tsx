import useAuth from "@/hooks/useAuth";

function Dashboard() {
  const { user, isError } = useAuth();

  return (
    <>
      <div>employee information not protected route</div>
    </>
  );
}

export default Dashboard;
