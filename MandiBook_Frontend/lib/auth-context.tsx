"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { User, UserRole } from "@/lib/types";
import { authApi, ApiError, type AuthResponse, type ProfileData } from "@/lib/api";
import { userApi } from "@/lib/data-api";

const AUTH_STORAGE_KEY = "mandibook_auth";

interface StoredAuth {
  token: string;
  user: User;
}

// ── Auth context types ───────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  tempAdminUserId: string | null;
  tempAdminOtpRequestId: string | null;
}

interface AuthActions {
  requestFarmerOtp: (phone: string) => Promise<void>;
  requestFarmerEmailOtp: (email: string) => Promise<AuthResponse>;
  loginAsFarmer: (phone: string, otp: string) => Promise<void>;
  loginAsFarmerEmail: (email: string, otp: string, otpRequestId: string) => Promise<void>;
  loginAsManager: (email: string, password: string) => Promise<void>;
  beginAdminLogin: (email: string, password: string) => Promise<AuthResponse>;
  loginAsAdmin: (code2fa: string) => Promise<void>;
  completeProfile: (data: ProfileData) => Promise<void>;
  logout: () => Promise<void>;
  setLanguage: (lang: "en" | "hi") => Promise<void>;
  refreshMe: () => Promise<void>;
}

type AuthContextType = AuthState & AuthActions;

const AuthContext = createContext<AuthContextType | null>(null);

const normalizeUser = (user: NonNullable<Awaited<ReturnType<typeof authApi.me>>["user"]>): User => {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    phone: user.phone,
    email: user.email,
    avatar: user.avatar,
    language: user.language,
    profileComplete: user.profileComplete,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt || new Date().toISOString(),
    ...(user.role === "farmer"
      ? {
          village: user.village,
          district: user.district,
          state: user.state,
          pincode: user.pincode,
          landHolding: user.landHolding,
          farmSize: user.farmSize,
          preferredMandis: user.preferredMandis || [],
          crops: user.crops || [],
          priceAlertCrops: user.priceAlertCrops || [],
        }
      : {}),
    ...(user.role === "manager"
      ? {
          mandiId: user.mandiId || "",
          designation: user.designation,
          managingSince: user.managingSince,
        }
      : {}),
    ...(user.role === "admin"
      ? {
          department: user.department,
          twoFactorEnabled: Boolean(user.twoFactorEnabled),
        }
      : {}),
  } as User;
};

const persistAuth = (token: string, user: User) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }));
};

const clearPersistedAuth = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    token: null,
    tempAdminUserId: null,
    tempAdminOtpRequestId: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const restoreSession = async () => {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) {
        setState((s) => ({ ...s, isLoading: false }));
        return;
      }

      const parsed = JSON.parse(raw) as StoredAuth;

      try {
        const me = await authApi.me(parsed.token);
        if (!me.user) {
          clearPersistedAuth();
          setState({ user: null, isAuthenticated: false, isLoading: false, token: null, tempAdminUserId: null, tempAdminOtpRequestId: null });
          return;
        }

        const user = normalizeUser(me.user);
        persistAuth(parsed.token, user);
        setState({ user, isAuthenticated: true, isLoading: false, token: parsed.token, tempAdminUserId: null, tempAdminOtpRequestId: null });
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          clearPersistedAuth();
          setState({ user: null, isAuthenticated: false, isLoading: false, token: null, tempAdminUserId: null, tempAdminOtpRequestId: null });
          return;
        }

        setState({
          user: parsed.user,
          isAuthenticated: true,
          isLoading: false,
          token: parsed.token,
          tempAdminUserId: null,
          tempAdminOtpRequestId: null,
        });
      }
    };

    void restoreSession();
  }, []);

  const refreshMe = useCallback(async () => {
    if (!state.token) return;
    const response = await authApi.me(state.token);
    if (!response.user) return;
    const user = normalizeUser(response.user);
    persistAuth(state.token, user);
    setState((s) => ({ ...s, user, isAuthenticated: true }));
  }, [state.token]);

  const requestFarmerOtp = useCallback(async (phone: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      await authApi.sendFarmerOtp(phone);
      setState((s) => ({ ...s, isLoading: false }));
    } catch (error) {
      setState((s) => ({ ...s, isLoading: false }));
      throw error;
    }
  }, []);

  const requestFarmerEmailOtp = useCallback(async (email: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const response = await authApi.sendFarmerEmailOtp(email);
      setState((s) => ({ ...s, isLoading: false }));
      return response;
    } catch (error) {
      setState((s) => ({ ...s, isLoading: false }));
      throw error;
    }
  }, []);

  const loginAsFarmer = useCallback(async (phone: string, otp: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const response = await authApi.verifyFarmerOtp(phone, otp);
      if (!response.token || !response.user) {
        throw new ApiError("Login response is incomplete", 500, response);
      }
      const user = normalizeUser(response.user);
      persistAuth(response.token, user);
      setState({ user, isAuthenticated: true, isLoading: false, token: response.token, tempAdminUserId: null, tempAdminOtpRequestId: null });
    } catch (error) {
      setState((s) => ({ ...s, isLoading: false }));
      throw error;
    }
  }, []);

  const loginAsFarmerEmail = useCallback(async (email: string, otp: string, otpRequestId: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const response = await authApi.verifyFarmerEmailOtp(email, otp, otpRequestId);
      if (!response.token || !response.user) {
        throw new ApiError("Login response is incomplete", 500, response);
      }
      const user = normalizeUser(response.user);
      persistAuth(response.token, user);
      setState({ user, isAuthenticated: true, isLoading: false, token: response.token, tempAdminUserId: null, tempAdminOtpRequestId: null });
    } catch (error) {
      setState((s) => ({ ...s, isLoading: false }));
      throw error;
    }
  }, []);

  const loginAsManager = useCallback(
    async (email: string, password: string) => {
      setState((s) => ({ ...s, isLoading: true }));
      try {
        const response = await authApi.managerLogin(email, password);
        if (!response.token || !response.user) {
          throw new ApiError("Login response is incomplete", 500, response);
        }
        const user = normalizeUser(response.user);
        persistAuth(response.token, user);
        setState({ user, isAuthenticated: true, isLoading: false, token: response.token, tempAdminUserId: null, tempAdminOtpRequestId: null });
      } catch (error) {
        setState((s) => ({ ...s, isLoading: false }));
        throw error;
      }
    },
    []
  );

  const beginAdminLogin = useCallback(
    async (email: string, password: string) => {
      setState((s) => ({ ...s, isLoading: true }));
      try {
        const response = await authApi.adminLogin(email, password);
        if (!response.tempUserId || !response.otpRequestId) {
          throw new ApiError("2FA initialization failed", 500, response);
        }
        setState((s) => ({
          ...s,
          isLoading: false,
          tempAdminUserId: response.tempUserId ?? null,
          tempAdminOtpRequestId: response.otpRequestId ?? null,
        }));
        return response;
      } catch (error) {
        setState((s) => ({ ...s, isLoading: false }));
        throw error;
      }
    },
    []
  );

  const loginAsAdmin = useCallback(async (code2fa: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      if (!state.tempAdminUserId || !state.tempAdminOtpRequestId) {
        throw new ApiError("Admin 2FA session not found", 400, null);
      }
      const response = await authApi.adminVerify2FA(state.tempAdminUserId, state.tempAdminOtpRequestId, code2fa);
      if (!response.token || !response.user) {
        throw new ApiError("Login response is incomplete", 500, response);
      }
      const user = normalizeUser(response.user);
      persistAuth(response.token, user);
      setState({ user, isAuthenticated: true, isLoading: false, token: response.token, tempAdminUserId: null, tempAdminOtpRequestId: null });
    } catch (error) {
      setState((s) => ({ ...s, isLoading: false }));
      throw error;
    }
  }, [state.tempAdminOtpRequestId, state.tempAdminUserId]);

  const logout = useCallback(async () => {
    const token = state.token;
    clearPersistedAuth();
    setState({ user: null, isAuthenticated: false, isLoading: false, token: null, tempAdminUserId: null, tempAdminOtpRequestId: null });
    if (!token) return;
    try {
      await authApi.logout(token);
    } catch {
      return;
    }
  }, [state.token]);

  const completeProfile = useCallback(async (data: ProfileData) => {
    if (!state.token) throw new ApiError("Not authenticated", 401, null);
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const response = await authApi.completeProfile(state.token, data);
      if (!response.user) throw new ApiError("Profile update failed", 500, response);
      const user = normalizeUser(response.user);
      persistAuth(state.token, user);
      setState((s) => ({ ...s, user, isLoading: false }));
    } catch (error) {
      setState((s) => ({ ...s, isLoading: false }));
      throw error;
    }
  }, [state.token]);

  const setLanguage = useCallback(async (lang: "en" | "hi") => {
    if (!state.token || !state.user) {
      setState((s) => {
        if (!s.user) return s;
        const updatedUser = { ...s.user, language: lang };
        if (s.token) {
          persistAuth(s.token, updatedUser);
        }
        return { ...s, user: updatedUser };
      });
      return;
    }

    const response = await userApi.updateProfile(state.token, { language: lang });
    const user = normalizeUser(response.data);
    persistAuth(state.token, user);
    setState((s) => ({ ...s, user }));
  }, [state.token, state.user]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        requestFarmerOtp,
        requestFarmerEmailOtp,
        loginAsFarmer,
        loginAsFarmerEmail,
        loginAsManager,
        beginAdminLogin,
        loginAsAdmin,
        completeProfile,
        logout,
        setLanguage,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// ── Route guard helper ───────────────────────────────────────────────────────

export function useRequireRole(role: UserRole): {
  user: User | null;
  isAuthorized: boolean;
  isLoading: boolean;
} {
  const { user, isAuthenticated, isLoading } = useAuth();
  return {
    user,
    isAuthorized: isAuthenticated && user?.role === role,
    isLoading,
  };
}
