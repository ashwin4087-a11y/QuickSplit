import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  expensesService,
  splitsService,
  ExpenseCreate,
  ExpenseUpdate,
  ExpenseSplitCreate,
} from "../services/expenses";

// --- Expenses ---
export const useExpenses = (groupId: number) =>
  useQuery({
    queryKey: ["groups", groupId, "expenses"],
    queryFn: () => expensesService.list(groupId),
    enabled: !!groupId,
    staleTime: 15000,
  });

export const useExpense = (groupId: number, expenseId: number) =>
  useQuery({
    queryKey: ["groups", groupId, "expenses", expenseId],
    queryFn: () => expensesService.get(groupId, expenseId),
    enabled: !!groupId && !!expenseId,
    staleTime: 15000,
  });

export const useCreateExpense = (groupId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ExpenseCreate) => expensesService.create(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "expenses"] });
    },
  });
};

export const useUpdateExpense = (groupId: number, expenseId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ExpenseUpdate) => expensesService.update(groupId, expenseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "expenses"] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "expenses", expenseId] });
    },
  });
};

export const useDeleteExpense = (groupId: number, expenseId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => expensesService.delete(groupId, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "expenses"] });
    },
  });
};

// --- Expense Splits ---
export const useExpenseSplits = (expenseId: number) =>
  useQuery({
    queryKey: ["expenses", expenseId, "splits"],
    queryFn: () => splitsService.list(expenseId),
    enabled: !!expenseId,
    staleTime: 15000,
  });

export const useCreateExpenseSplits = (expenseId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (splits: ExpenseSplitCreate[]) => splitsService.create(expenseId, splits),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", expenseId, "splits"] });
    },
  });
};

export const useUpdateExpenseSplits = (expenseId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (splits: ExpenseSplitCreate[]) => splitsService.update(expenseId, splits),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", expenseId, "splits"] });
    },
  });
};

export const useDeleteExpenseSplits = (expenseId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => splitsService.deleteAll(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", expenseId, "splits"] });
    },
  });
};
