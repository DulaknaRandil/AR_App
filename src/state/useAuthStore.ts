import { create } from 'zustand';
import { supabase } from '../api/supabaseClient';
import { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  setSession: (session: Session | null) => void;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  checkSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session });
  },
}));
