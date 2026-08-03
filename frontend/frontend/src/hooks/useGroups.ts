import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsService, GroupData } from "../services/groups";

export const useGroups = () => {
  return useQuery({
    queryKey: ["groups"],
    queryFn: groupsService.list,
    staleTime: 30000,
    gcTime: 300000,
  });
};

export const useGroup = (groupId: number) => {
  return useQuery({
    queryKey: ["groups", groupId],
    queryFn: () => groupsService.get(groupId),
    enabled: !!groupId,
    staleTime: 30000,
    gcTime: 300000,
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GroupData) => groupsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};
