import { api } from "./api";

// --- Types matching backend schemas exactly ---
export type Expense = {
  id: number;
  group_id: number;
  title: string;
  description: string | null;
  amount: string; // Decimal comes back as string from JSON
  paid_by: number; // user ID
  created_at: string;
  updated_at: string;
};

export type ExpenseCreate = {
  title: string;
  description?: string;
  amount: number;
  paid_by: number;
};

export type ExpenseUpdate = Partial<ExpenseCreate>;

export type ExpenseSplit = {
  id: number;
  expense_id: number;
  user_id: number;
  amount_owed: string; // Decimal as string
  created_at: string;
  updated_at: string;
};

export type ExpenseSplitCreate = {
  user_id: number;
  amount_owed: number;
};

// --- Expenses ---
export const expensesService = {
  list: async (groupId: number): Promise<Expense[]> => {
    const response = await api.get<Expense[]>(`/groups/${groupId}/expenses`);
    return response.data;
  },
  get: async (groupId: number, expenseId: number): Promise<Expense> => {
    const response = await api.get<Expense>(`/groups/${groupId}/expenses/${expenseId}`);
    return response.data;
  },
  create: async (groupId: number, data: ExpenseCreate): Promise<Expense> => {
    const response = await api.post<Expense>(`/groups/${groupId}/expenses`, data);
    return response.data;
  },
  update: async (groupId: number, expenseId: number, data: ExpenseUpdate): Promise<Expense> => {
    // Backend uses PUT not PATCH
    const response = await api.put<Expense>(`/groups/${groupId}/expenses/${expenseId}`, data);
    return response.data;
  },
  delete: async (groupId: number, expenseId: number): Promise<void> => {
    await api.delete(`/groups/${groupId}/expenses/${expenseId}`);
  },
};

// --- Expense Splits ---
export const splitsService = {
  list: async (expenseId: number): Promise<ExpenseSplit[]> => {
    const response = await api.get<ExpenseSplit[]>(`/expenses/${expenseId}/splits`);
    return response.data;
  },
  create: async (expenseId: number, splits: ExpenseSplitCreate[]): Promise<ExpenseSplit[]> => {
    const response = await api.post<ExpenseSplit[]>(`/expenses/${expenseId}/splits`, { splits });
    return response.data;
  },
  update: async (expenseId: number, splits: ExpenseSplitCreate[]): Promise<ExpenseSplit[]> => {
    // Backend PUT replaces all splits
    const response = await api.put<ExpenseSplit[]>(`/expenses/${expenseId}/splits`, { splits });
    return response.data;
  },
  deleteAll: async (expenseId: number): Promise<void> => {
    await api.delete(`/expenses/${expenseId}/splits`);
  },
};
