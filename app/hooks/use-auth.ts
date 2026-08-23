import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/api/auth";

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
  });
};
