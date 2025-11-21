import { create } from 'zustand';

interface ARState {
  dominantColor: string | null;
  setDominantColor: (color: string | null) => void;
}

export const useARState = create<ARState>((set) => ({
  dominantColor: null,
  setDominantColor: (color) => set({ dominantColor: color }),
}));
