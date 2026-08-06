/**
 * AuthContext — sesja użytkownika oparta o JWT RacePortal.
 *
 * Token: klucz `raceportal_token` w localStorage (`lib/api` TOKEN_KEY).
 * Bootstrap przy mount: jeśli jest token → GET `/api/auth/me`; błąd → wyczyszczenie sesji.
 * persistAuth(user, token): ustawia state + zapis/usunięcie JWT.
 *
 * Login: POST `/api/auth/login` → { token, user }.
 * Register: może zwrócić `requiresVerification` (kod e-mail) zanim wyda JWT.
 * Google: `loginWithGoogle(idToken)` → POST `/api/auth/oauth/google` (wymiana idToken GSI
 * na JWT RacePortal) — patrz GoogleSignInButton.
 *
 * isAuthenticated = !!user (nie sam fakt posiadania tokena — dopiero po udanym /me lub loginie).
 * AuthGate w routes.tsx czeka na `isLoading` zanim zdecyduje o redirect.
 *
 * Pomysł (alt): httpOnly cookie zamiast localStorage; refresh token / sliding session.
 */

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
    profile?: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      hasDrivingLicenseB?: boolean;
      pzmLicense?: string;
    },
  ) => Promise<RegisterResult>;
  verifyEmail: (email: string, code: string) => Promise<{ ok: boolean; message?: string }>;
  resendCode: (email: string) => Promise<{ ok: boolean; message?: string }>;
  loginWithGoogle: (idToken: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (data: {
    username?: string;
    avatar?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    hasDrivingLicenseB?: boolean;
    pzmLicense?: string;
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

  /** Zapis sesji: user w React state + JWT w localStorage (lub clear przy null). */
  const persistAuth = useCallback((nextUser: User | null, token?: string) => {
    setUser(nextUser);
    if (token) setToken(token);
    if (!nextUser) setToken(null);
  }, []);

  // Bootstrap: odtwórz sesję z raceportal_token → /api/auth/me
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

  const register = async (
    username: string,
    email: string,
    password: string,
    profile?: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      hasDrivingLicenseB?: boolean;
      pzmLicense?: string;
    },
  ): Promise<RegisterResult> => {
    try {
      const res = await api.post<{
        requiresVerification?: boolean;
        email?: string;
        message?: string;
        token?: string;
        user?: User;
      }>("/api/auth/register", {
        username,
        email,
        password,
        firstName: profile?.firstName?.trim() || undefined,
        lastName: profile?.lastName?.trim() || undefined,
        phone: profile?.phone?.trim() || undefined,
        hasDrivingLicenseB: profile?.hasDrivingLicenseB ?? false,
        pzmLicense: profile?.pzmLicense?.trim() || undefined,
      });

      // Ścieżka z weryfikacją e-mail (MailHog w Docker) — JWT dopiero po verifyEmail
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

  /** Wymiana Google idToken (GSI credential) na JWT RacePortal. */
  const loginWithGoogle = async (idToken: string) => {
    try {
      const res = await api.post<{ token: string; user: User }>("/api/auth/oauth/google", { idToken });
      persistAuth(res.user, res.token);
      return { ok: true };
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Nie udało się zalogować przez Google";
      return { ok: false, message };
    }
  };

  const logout = () => persistAuth(null);

  const updateProfile = async (data: {
    username?: string;
    avatar?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
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
        loginWithGoogle,
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
