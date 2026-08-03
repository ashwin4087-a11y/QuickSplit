import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DeviceEventEmitter } from "react-native";
import * as SecureStore from "expo-secure-store";
import { api } from "../services/api";

type User = {
  id: number;
  full_name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
    const subscription = DeviceEventEmitter.addListener("auth:logout", logout);
    return () => subscription.remove();
  }, []);

  const loadUser = async () => {
    try {
      const token = await SecureStore.getItemAsync("access_token");
      if (token) {
        const response = await api.get("/auth/me");
        setUser(response.data);
      }
    } catch (error) {
      console.error("Failed to load user", error);
      await SecureStore.deleteItemAsync("access_token");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string) => {
    await SecureStore.setItemAsync("access_token", token);
    await loadUser();
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("access_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
