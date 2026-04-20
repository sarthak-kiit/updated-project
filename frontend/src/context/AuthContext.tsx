import React, {
  createContext, useContext, useState, useCallback, ReactNode
} from 'react';
import { logout as logoutApi } from '../services/api';

interface AuthUser {
  userId: number;
  fullName: string;
  email: string;
  role: 'MENTOR' | 'MENTEE' | 'ADMIN';
}

interface AuthContextType {
  user: AuthUser | null;
  login: (data: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {

  // Load from localStorage (persists across refresh)
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((data: AuthUser) => {
    // No token — just store user info for UI
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
  }, []);

  const logout = useCallback(() => {
    // Call backend to clear session
    logoutApi().catch(() => {});
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}