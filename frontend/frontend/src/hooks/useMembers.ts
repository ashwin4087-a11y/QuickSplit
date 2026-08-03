import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsService } from "../services/groups";

export const useMembers = (groupId: number) => {
  return useQuery({
    queryKey: ["groups", groupId, "members"],
    queryFn: () => groupsService.listMembers(groupId),
    enabled: !!groupId,
    staleTime: 30000,
  });
};

export const useAddMember = (groupId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => groupsService.addMember(groupId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "members"] });
    },
  });
};
