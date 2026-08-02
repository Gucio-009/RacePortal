import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { api, setToken, getToken, ApiError } from "../lib/api";
import type { User } from "../lib/types";

export type { User };

type RegisterResult =
  | { ok: true; requiresVerification?: false }
  | { ok: true; requiresVerification: true; email: string; message?: string }
  | { ok: false; message?: string };

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<RegisterResult>;
  verifyEmail: (email: string, code: string) => Promise<{ ok: boolean; message?: string }>;
  resendCode: (email: string) => Promise<{ ok: boolean; message?: string }>;
  socialLogin: (provider: "google" | "facebook") => Promise<void>;
  logout: () => void;
  updateProfile: (data: {
    username?: string;
    email?: string;
    avatar?: string;
  }) => Promise<{ ok: boolean; message?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ ok: boolean; message?: string }>;
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

  const register = async (username: string, email: string, password: string): Promise<RegisterResult> => {
    try {
      const res = await api.post<{
        requiresVerification?: boolean;
        email?: string;
        message?: string;
        token?: string;
        user?: User;
      }>("/api/auth/register", { username, email, password });

      if (res.requiresVerification) {
        return {
          ok: true,
          requiresVerification: true,
          email: res.email || email,
          message: res.message,
        };
      }

      if (res.token && res.user) {
        persistAuth(res.user, res.token);
      }
      return { ok: true };
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Nie udało się utworzyć konta";
      return { ok: false, message };
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    try {
      const res = await api.post<{ token: string; user: User }>("/api/auth/verify-email", { email, code });
      persistAuth(res.user, res.token);
      return { ok: true };
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Nieprawidłowy kod weryfikacyjny";
      return { ok: false, message };
    }
  };

  const resendCode = async (email: string) => {
    try {
      const res = await api.post<{ message: string }>("/api/auth/resend-code", { email });
      return { ok: true, message: res.message || "Kod wysłany ponownie" };
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Nie udało się wysłać kodu";
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

  const updateProfile = async (data: { username?: string; email?: string; avatar?: string }) => {
    try {
      const updated = await api.patch<User>("/api/auth/me", data);
      setUser(updated);
      return { ok: true };
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Nie udało się zaktualizować profilu";
      return { ok: false, message };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const res = await api.post<{ message: string }>("/api/auth/me/password", {
        currentPassword,
        newPassword,
      });
      return { ok: true, message: res.message };
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Nie udało się zmienić hasła";
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
        verifyEmail,
        resendCode,
        socialLogin,
        logout,
        updateProfile,
        changePassword,
        forgotPassword,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
