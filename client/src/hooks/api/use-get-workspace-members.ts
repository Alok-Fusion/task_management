import { getMembersInWorkspaceQueryFn } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const useGetWorkspaceMembers = (workspaceId: string) => {
  const query = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => getMembersInWorkspaceQueryFn(workspaceId),
    staleTime: Infinity,
    refetchInterval: 5000,
  });
  return query;
};

export default useGetWorkspaceMembers;
