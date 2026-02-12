import { create } from 'zustand';
import type { User } from '@busap/shared';
import { api } from '../lib/api';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      const hasTokens = await api.hasTokens();
      if (!hasTokens) {
        set({ user: null, loading: false });
        return;
      }
      const user = await api.getMe();
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ error: null, loading: true });
    try {
      const { user } = await api.login(email, password);
      set({ user: user as User, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ error: message, loading: false });
      throw err;
    }
  },

  register: async (email: string, password: string, firstName: string, lastName: string) => {
    set({ error: null, loading: true });
    try {
      const { user } = await api.register(email, password, firstName, lastName);
      set({ user: user as User, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      set({ error: message, loading: false });
      throw err;
    }
  },

  logout: async () => {
    await api.logout();
    set({ user: null });
  },

  clearError: () => set({ error: null }),
}));
