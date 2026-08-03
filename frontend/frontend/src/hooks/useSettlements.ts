import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  balancesService,
  settlementsService,
  SettlementCreate,
} from "../services/settlements";

// ─── Query Keys ────────────────────────────────────────────────────────────────
// Shared invalidation helpers
const balancesKey = (groupId: number) => ["groups", groupId, "balances"];
const suggestionsKey = (groupId: number) => ["groups", groupId, "settlements", "suggestions"];
const settlementsKey = (groupId: number) => ["groups", groupId, "settlements"];

// ─── Balances ─────────────────────────────────────────────────────────────────
export const useBalances = (groupId: number) =>
  useQuery({
    queryKey: balancesKey(groupId),
    queryFn: () => balancesService.getBalances(groupId),
    enabled: !!groupId,
    staleTime: 0,
  });

// ─── Settlement Suggestions ────────────────────────────────────────────────────
export const useSettlementSuggestions = (groupId: number) =>
  useQuery({
    queryKey: suggestionsKey(groupId),
    queryFn: () => settlementsService.getSuggestions(groupId),
    enabled: !!groupId,
    staleTime: 0,
  });

// ─── Settlement History ────────────────────────────────────────────────────────
export const useSettlements = (groupId: number) =>
  useQuery({
    queryKey: settlementsKey(groupId),
    queryFn: () => settlementsService.list(groupId),
    enabled: !!groupId,
    staleTime: 15000,
  });

// ─── Create Settlement ────────────────────────────────────────────────────────
export const useCreateSettlement = (groupId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SettlementCreate) => settlementsService.create(groupId, data),
    onSuccess: () => {
      // Invalidate all 3 dependent queries
      queryClient.invalidateQueries({ queryKey: balancesKey(groupId) });
      queryClient.invalidateQueries({ queryKey: suggestionsKey(groupId) });
      queryClient.invalidateQueries({ queryKey: settlementsKey(groupId) });
    },
  });
};

// ─── Complete Settlement ──────────────────────────────────────────────────────
export const useCompleteSettlement = (groupId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settlementId: number) => settlementsService.complete(settlementId),
    onSuccess: () => {
      // Invalidate all 3 dependent queries
      queryClient.invalidateQueries({ queryKey: balancesKey(groupId) });
      queryClient.invalidateQueries({ queryKey: suggestionsKey(groupId) });
      queryClient.invalidateQueries({ queryKey: settlementsKey(groupId) });
    },
  });
};
