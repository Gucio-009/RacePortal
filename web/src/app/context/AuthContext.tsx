/**
 * AuthContext — sesja użytkownika (httpOnly cookies rp_at / rp_rt).
 *
 * Bootstrap: GET `/api/auth/me` z credentials (bez localStorage JWT).
 * Login / verify / Google ustawiają cookies po stronie API.
 * Logout: POST `/api/auth/logout` + clear state.
 */

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { api, clearLegacyToken, setOnAuthExpired, ApiError } from "../lib/api";
import { deferUntilIdle } from "../lib/deferUntilIdle";
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
    profile?: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      address?: string;
      instagramUrl?: string;
      hasDrivingLicenseB?: boolean;
      pzmLicense?: string;
    },
  ) => Promise<RegisterResult>;
  verifyEmail: (token: string, email?: string) => Promise<{ ok: boolean; message?: string }>;
  resendCode: (email: string) => Promise<{ ok: boolean; message?: string }>;
  loginWithGoogle: (idToken: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (data: {
    username?: string;
    avatar?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    instagramUrl?: string;
    hasDrivingLicenseB?: boolean;
    pzmLicense?: string;
  }) => Promise<{ ok: boolean; message?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  forgotPassword: (email: string) => Promise<{ ok: boolean; message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ ok: boolean; message: string }>;
  requestEmailChange: (
    newEmail: string,
    currentPassword: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  confirmEmailChange: (token: string) => Promise<{ ok: boolean; message?: string }>;
  refreshSession: () => Promise<{ ok: boolean; message?: string }>;
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

  const persistAuth = useCallback((nextUser: User | null) => {
    setUser(nextUser);
    if (!nextUser) clearLegacyToken();
  }, []);

  useEffect(() => {
    clearLegacyToken();
    return deferUntilIdle(() => {
      void (async () => {
        try {
          const me = await api.get<User>("/api/auth/me");
          setUser(me);
        } catch {
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      })();
    }, 2000);
  }, []);

  useEffect(() => {
    setOnAuthExpired(() => setUser(null));
    return () => setOnAuthExpired(null);
  }, []);

  useEffect(() => {
    let lastAt = 0;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!user) return;
      const now = Date.now();
      if (now - lastAt < 15_000) return;
      lastAt = now;
      void (async () => {
        try {
          const res = await api.post<{ user: User }>("/api/auth/refresh", {});
          persistAuth(res.user);
        } catch {
          /* 401 → interceptor */
        }
      })();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [persistAuth, user]);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post<{ user: User }>("/api/auth/login", { email, password });
      persistAuth(res.user);
      return { ok: true };
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Nieprawidłowy email lub hasło";
      return { ok: false, message };
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    profile?: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      address?: string;
      instagramUrl?: string;
      hasDrivingLicenseB?: boolean;
      pzmLicense?: string;
    },
  ): Promise<RegisterResult> => {
    try {
      const res = await api.post<{
        requiresVerification?: boolean;
        email?: string;
        message?: string;
        user?: User;
      }>("/api/auth/register", {
        username,
        email,
        password,
        firstName: profile?.firstName?.trim() || undefined,
        lastName: profile?.lastName?.trim() || undefined,
        phone: profile?.phone?.trim() || undefined,
        address: profile?.address?.trim() || undefined,
        instagramUrl: profile?.instagramUrl?.trim() || undefined,
        hasDrivingLicenseB: profile?.hasDrivingLicenseB ?? false,
        pzmLicense: profile?.pzmLicense?.trim() || undefined,
      });

      if (res.requiresVerification) {
        return {
          ok: true,
          requiresVerification: true,
          email: res.email || email,
          message: res.message,
        };
      }

      if (res.user) persistAuth(res.user);
      return { ok: true };
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Nie udało się utworzyć konta";
      return { ok: false, message };
    }
  };

  const verifyEmail = async (token: string, email?: string) => {
    try {
      const res = await api.post<{ user: User }>("/api/auth/verify-email", {
        token,
        ...(email ? { email } : {}),
      });
      persistAuth(res.user);
      return { ok: true };
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Nieprawidłowy lub wygasły link";
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

  const loginWithGoogle = async (idToken: string) => {
    try {
      const res = await api.post<{ user: User }>("/api/auth/oauth/google", { idToken });
      persistAuth(res.user);
      return { ok: true };
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Nie udało się zalogować przez Google";
      return { ok: false, message };
    }
  };

  const logout = () => {
    void (async () => {
      try {
        await api.post("/api/auth/logout", {});
      } catch {
        /* ignore */
      } finally {
        persistAuth(null);
      }
    })();
  };

  const updateProfile = async (data: {
    username?: string;
    avatar?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    instagramUrl?: string;
    hasDrivingLicenseB?: boolean;
    pzmLicense?: string;
  }) => {
    try {
      const updated = await api.patch<User>("/api/auth/me", {
        username: data.username,
        avatar: data.avatar ?? "",
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        instagramUrl: data.instagramUrl,
        hasDrivingLicenseB: data.hasDrivingLicenseB,
        pzmLicense: data.pzmLicense,
      });
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
      persistAuth(null);
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

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const res = await api.post<{ message: string }>("/api/auth/reset-password", {
        token,
        newPassword,
      });
      return { ok: true, message: res.message };
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Nie udało się zmienić hasła";
      return { ok: false, message };
    }
  };

  const requestEmailChange = async (newEmail: string, currentPassword: string) => {
    try {
      const res = await api.post<{ message: string }>("/api/auth/me/email-change", {
        newEmail,
        currentPassword,
      });
      return { ok: true, message: res.message };
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Nie udało się wysłać kodu";
      return { ok: false, message };
    }
  };

  const confirmEmailChange = async (token: string) => {
    try {
      const res = await api.post<{ user: User }>("/api/auth/me/email-change/confirm", { token });
      persistAuth(res.user);
      return { ok: true, message: "Adres e-mail został zmieniony" };
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Nie udało się potwierdzić zmiany e-maila";
      return { ok: false, message };
    }
  };

  const refreshSession = useCallback(async () => {
    try {
      const res = await api.post<{ user: User }>("/api/auth/refresh", {});
      persistAuth(res.user);
      return { ok: true };
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Nie udało się odświeżyć sesji";
      return { ok: false, message };
    }
  }, [persistAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        verifyEmail,
        resendCode,
        loginWithGoogle,
        logout,
        updateProfile,
        changePassword,
        forgotPassword,
        resetPassword,
        requestEmailChange,
        confirmEmailChange,
        refreshSession,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
