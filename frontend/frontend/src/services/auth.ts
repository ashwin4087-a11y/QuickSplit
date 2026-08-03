import { api } from "./api";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = loginSchema.extend({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

export const authService = {
  login: async (data: LoginData) => {
    const response = await api.post<{ access_token: string }>("/auth/login", data);
    return response.data;
  },
  register: async (data: RegisterData) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },
};
