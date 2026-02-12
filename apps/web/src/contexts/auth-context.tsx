'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import type { User, UserCompanyMembership } from '@busap/shared';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isOwnerOf: (companyId: string) => boolean;
  isManagerOf: (companyId: string) => boolean;
  getMyCompanies: () => UserCompanyMembership[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      if (!api.hasTokens()) {
        setUser(null);
        return;
      }
      const currentUser = await api.getMe();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string): Promise<User> {
    const { user } = await api.login(email, password);
    setUser(user as User);
    return user as User;
  }

  async function register(email: string, password: string, firstName: string, lastName: string): Promise<User> {
    const { user } = await api.register(email, password, firstName, lastName);
    setUser(user as User);
    return user as User;
  }

  async function logout() {
    await api.logout();
    setUser(null);
  }

  async function refreshUser() {
    const currentUser = await api.getMe();
    setUser(currentUser);
  }

  const isOwnerOf = useMemo(() => {
    return (companyId: string) =>
      user?.companyMemberships?.some(
        (m) => m.companyId === companyId && m.role === 'owner'
      ) ?? false;
  }, [user?.companyMemberships]);

  const isManagerOf = useMemo(() => {
    return (companyId: string) =>
      user?.companyMemberships?.some(
        (m) => m.companyId === companyId && (m.role === 'owner' || m.role === 'manager')
      ) ?? false;
  }, [user?.companyMemberships]);

  const getMyCompanies = useMemo(() => {
    return () =>
      user?.companyMemberships?.filter(
        (m) => m.role === 'owner' || m.role === 'manager'
      ) ?? [];
  }, [user?.companyMemberships]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isOwnerOf,
        isManagerOf,
        getMyCompanies,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
