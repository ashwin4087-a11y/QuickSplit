import { api } from "./api";

// --- Types matching backend schemas exactly ---

export type UserBalance = {
  user_id: number;
  full_name: string;
  email: string;
  paid: string;   // Decimal serialised as string
  owed: string;
  balance: string; // positive = owed to you, negative = you owe
};

export type SettlementSuggestion = {
  from_user_id: number;
  from_user_name: string;
  to_user_id: number;
  to_user_name: string;
  amount: string;
};

export type Settlement = {
  id: number;
  group_id: number;
  payer_id: number;
  receiver_id: number;
  amount: string;
  status: "PENDING" | "COMPLETED";
  created_at: string;
  settled_at: string | null;
};

export type SettlementCreate = {
  payer_id: number;
  receiver_id: number;
  amount: number;
};

// --- Balances ---
export const balancesService = {
  getBalances: async (groupId: number): Promise<UserBalance[]> => {
    const response = await api.get<UserBalance[]>(`/groups/${groupId}/balances`);
    return response.data;
  },
};

// --- Settlements ---
export const settlementsService = {
  getSuggestions: async (groupId: number): Promise<SettlementSuggestion[]> => {
    const response = await api.get<SettlementSuggestion[]>(
      `/groups/${groupId}/settlements/suggestions`
    );
    return response.data;
  },
  list: async (groupId: number): Promise<Settlement[]> => {
    const response = await api.get<Settlement[]>(`/groups/${groupId}/settlements`);
    return response.data;
  },
  create: async (groupId: number, data: SettlementCreate): Promise<Settlement> => {
    const response = await api.post<Settlement>(`/groups/${groupId}/settlements`, data);
    return response.data;
  },
  complete: async (settlementId: number): Promise<Settlement> => {
    const response = await api.patch<Settlement>(`/settlements/${settlementId}/complete`);
    return response.data;
  },
};
