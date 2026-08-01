import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { api, setToken, getToken, ApiError } from "../lib/api";
import type { User } from "../lib/types";

export type { User };

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  socialLogin: (provider: "google" | "facebook") => Promise<void>;
  logout: () => void;
  updateProfile: (data: { username?: string; avatar?: string }) => Promise<{ ok: boolean; message?: string }>;
  forgotPassword: (email: string) => Promise<{ ok: boolean; message: string }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistAuth = useCallback((nextUser: User | null, token?: string) => {
    setUser(nextUser);
    if (token) setToken(token);
    if (!nextUser) setToken(null);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      if (!getToken()) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await api.get<User>("/api/auth/me");
        setUser(me);
      } catch {
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post<{ token: string; user: User }>("/api/auth/login", { email, password });
      persistAuth(res.user, res.token);
      return { ok: true };
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Nieprawidłowy email lub hasło";
      return { ok: false, message };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const res = await api.post<{ token: string; user: User }>("/api/auth/register", {
        username,
        email,
        password,
      });
      persistAuth(res.user, res.token);
      return { ok: true };
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Nie udało się utworzyć konta";
      return { ok: false, message };
    }
  };

  const socialLogin = async (_provider: "google" | "facebook") => {
    const result = await login("test@wp.pl", "test123");
    if (!result.ok) {
      throw new Error(result.message || "Demo login failed");
    }
  };

  const logout = () => persistAuth(null);

  const updateProfile = async (data: { username?: string; avatar?: string }) => {
    try {
      const updated = await api.patch<User>("/api/auth/me", data);
      setUser(updated);
      return { ok: true };
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Nie udało się zaktualizować profilu";
      return { ok: false, message };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await api.post<{ message: string }>("/api/auth/forgot-password", { email });
      return { ok: true, message: res.message };
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : "Nie udało się wysłać instrukcji resetu hasła";
      return { ok: false, message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        socialLogin,
        logout,
        updateProfile,
        forgotPassword,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
