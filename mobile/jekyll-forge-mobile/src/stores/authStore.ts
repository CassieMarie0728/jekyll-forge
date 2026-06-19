import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: string;
  name: string;
  email: string;
  openId: string;
}

interface AuthStore {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>(set => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  token: null,

  setUser: (user: User) => {
    set({ user, isAuthenticated: true });
  },

  setToken: async (token: string) => {
    await AsyncStorage.setItem("authToken", token);
    set({ token, isAuthenticated: true });
  },

  logout: async () => {
    await AsyncStorage.removeItem("authToken");
    await AsyncStorage.removeItem("user");
    set({ isAuthenticated: false, user: null, token: null });
  },

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const userJson = await AsyncStorage.getItem("user");

      if (token && userJson) {
        const user = JSON.parse(userJson);
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      set({ isLoading: false });
    }
  },
}));
