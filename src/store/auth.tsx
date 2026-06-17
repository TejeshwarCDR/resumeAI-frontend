import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { EP } from "@/lib/endpoints";

export interface User {
  id: string;
  full_name: string;
  email: string;
  university?: string;
  graduation_year?: number;
  target_role_category?: string;
  career_goal?: string;
  onboarding_completed?: boolean;
}

interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  university?: string;
  graduation_year?: number;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login(email: string, password: string): Promise<void>;
  register(data: RegisterPayload): Promise<void>;
  logout(): void;
  setUser: (u: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("sig_token"));

  useEffect(() => {
    if (token && !user) {
      api.get<User>(EP.profile).then((r) => setUser(r.data)).catch(() => {
        setToken(null);
        localStorage.removeItem("sig_token");
      });
    }
  }, [token]);

  const persist = (t: string, u: User) => {
    localStorage.setItem("sig_token", t);
    setToken(t);
    setUser(u);
  };

  const login = async (email: string, password: string) => {
    const r = await api.post<{ token: string; user: User }>(EP.login, { email, password });
    persist(r.data.token, r.data.user);
    if (!r.data.user.onboarding_completed) {
      window.location.href = "/onboarding";
    } else {
      window.location.href = "/";
    }
  };

  const register = async (data: RegisterPayload) => {
    const r = await api.post<{ token: string; user: User }>(EP.register, data);
    persist(r.data.token, r.data.user);
    window.location.href = "/onboarding";
  };

  const logout = () => {
    localStorage.removeItem("sig_token");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
