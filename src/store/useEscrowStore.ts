import { create } from "zustand";

type EscrowStore = {
  connected: boolean;
  toggleConnection: () => void;
};

export const useEscrowStore = create<EscrowStore>((set) => ({
  connected: false,
  toggleConnection: () => set((state) => ({ connected: !state.connected })),
}));
