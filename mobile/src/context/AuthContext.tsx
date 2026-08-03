import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, ApiError, setToken, getToken } from "../api/client";
import type { User } from "../api/types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  register: (body: Record<string, unknown>) => Promise<{
    ok: boolean;
    message?: string;
    requiresVerification?: boolean;
    email?: string;
  }>;
  verifyEmail: (email: string, code: string) => Promise<{ ok: boolean; message?: string }>;
  resendCode: (email: string) => Promise<{ ok: boolean; message?: string }>;
  refreshMe: () => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const me = await api.get<User>("/api/auth/me");
    setUser(me);
  }, []);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        await refreshMe();
      } catch {
        await setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.post<{ token: string; user: User }>("/api/auth/login", { email, password });
      await setToken(res.token);
      setUser(res.user);
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e instanceof ApiError ? e.message : "Błąd logowania" };
    }
  }, []);

  const register = useCallback(async (body: Record<string, unknown>) => {
    try {
      const res = await api.post<{
        requiresVerification?: boolean;
        email?: string;
        message?: string;
        token?: string;
        user?: User;
      }>("/api/auth/register", body);
      if (res.token && res.user) {
        await setToken(res.token);
        setUser(res.user);
      }
      return {
        ok: true,
        requiresVerification: Boolean(res.requiresVerification),
        email: res.email,
        message: res.message,
      };
    } catch (e) {
      return { ok: false, message: e instanceof ApiError ? e.message : "Błąd rejestracji" };
    }
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    try {
      const res = await api.post<{ token: string; user: User }>("/api/auth/verify-email", { email, code });
      await setToken(res.token);
      setUser(res.user);
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e instanceof ApiError ? e.message : "Błąd weryfikacji" };
    }
  }, []);

  const resendCode = useCallback(async (email: string) => {
    try {
      const res = await api.post<{ message?: string }>("/api/auth/resend-code", { email });
      return { ok: true, message: res.message || "Kod wysłany" };
    } catch (e) {
      return { ok: false, message: e instanceof ApiError ? e.message : "Nie udało się wysłać kodu" };
    }
  }, []);

  const logout = useCallback(async () => {
    await setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyEmail,
        resendCode,
        refreshMe,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
