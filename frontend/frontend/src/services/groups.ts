import { api } from "./api";
import { z } from "zod";

export type Group = {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  created_at: string;
};

export const groupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export type GroupData = z.infer<typeof groupSchema>;

export const groupsService = {
  list: async () => {
    const response = await api.get<Group[]>("/groups/");
    return response.data;
  },
  get: async (id: number) => {
    const response = await api.get<Group>(`/groups/${id}`);
    return response.data;
  },
  create: async (data: GroupData) => {
    const response = await api.post<Group>("/groups/", data);
    return response.data;
  },
  // Members
  listMembers: async (groupId: number) => {
    const response = await api.get(`/groups/${groupId}/members`);
    return response.data;
  },
  addMember: async (groupId: number, email: string) => {
    const response = await api.post(`/groups/${groupId}/members`, { email });
    return response.data;
  },
  removeMember: async (groupId: number, userId: number) => {
    const response = await api.delete(`/groups/${groupId}/members/${userId}`);
    return response.data;
  }
};
