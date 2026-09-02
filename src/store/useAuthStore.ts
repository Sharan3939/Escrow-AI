import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  walletAddress: string;
  username: string;
  role: "CLIENT" | "FREELANCER" | "ADMIN";
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage", // name of the item in the storage (must be unique)
    }
  )
);
