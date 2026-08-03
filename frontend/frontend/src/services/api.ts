import axios from "axios";
import * as SecureStore from "expo-secure-store";

import { DeviceEventEmitter } from "react-native";

if (!process.env.EXPO_PUBLIC_API_URL) {
  console.warn("EXPO_PUBLIC_API_URL is not set. API calls will fail.");
}

const API_URL = process.env.EXPO_PUBLIC_API_URL as string;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401s globally (placeholder)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await SecureStore.deleteItemAsync("access_token");
      DeviceEventEmitter.emit("auth:logout");
    } else if (error.response && error.response.status >= 500) {
      console.warn("Server Error:", error.response.data);
    }
    return Promise.reject(error);
  }
);
