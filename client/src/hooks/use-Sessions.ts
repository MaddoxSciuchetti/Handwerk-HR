import { useQuery } from "@tanstack/react-query";
import { getSessions } from "../lib/api";

export const SESSIONS = "sessions";

const useSessions = () => {
  const { data, ...rest } = useQuery({
    queryKey: [SESSIONS],
    queryFn: getSessions,
  });

  const sessions = data ?? [];
  if (!sessions) {
    throw new Error("userSession Error");
  }

  return { sessions: sessions || [], ...rest };
};
export default useSessions;
