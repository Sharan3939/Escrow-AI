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
  isHydrated: boolean;
  login: (user: User) => void;
  setRole: (role: "CLIENT" | "FREELANCER") => void;
  logout: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isHydrated: false,

      login: (user) => {
        console.log("[Auth] Login successful:", user);
        set({
          user,
          isAuthenticated: true,
        });
      },

      setRole: (role) => {
        set((state) => ({
          user: state.user ? { ...state.user, role } : null,
        }));
      },

      logout: () => {
        console.log("[Auth] Logout");
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      setHydrated: (isHydrated) => {
        set({ isHydrated });
      },
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);