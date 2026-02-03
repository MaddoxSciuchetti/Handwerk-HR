import { EmployFormSchema, fetchChefData } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import z from "zod";

export type TEmployForm = z.infer<typeof EmployFormSchema>;

function Ceo_Dashboard() {
  const {
    data: chefdata,
    isLoading,
    error,
  } = useQuery<TEmployForm>({
    queryKey: ["user"],
    queryFn: fetchChefData,
  });

  const uniqueUser = useMemo(() => {
    if (!chefdata) return [];
    const userMap = new Map<string, TEmployForm[0]>();
    chefdata.forEach((item) => {
      if (!userMap.has(item.owner)) {
        userMap.set(item.owner, item);
      }
    });

    return Array.from(userMap.values());
  }, [chefdata]);

  console.log(chefdata);

  if (isLoading) return <div>Loading</div>;
  if (error) console.log(error);
  return (
    <>
      <div className="flex outline w-4xl h-120 absolute">
        <div className="relative outline w-1/3 h-auto">Content</div>
        <div className="relative outline w-2/3 h-auto">
          <div className="flex outline w-auto h-20 gap-3.5">
            {uniqueUser.map((user) => (
              <div
                key={user.owner}
                className="flex mx-auto items-center justify-center w-full "
              >
                {user.owner}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default Ceo_Dashboard;
