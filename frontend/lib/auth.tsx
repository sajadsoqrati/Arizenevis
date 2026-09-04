"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  api,
  setAccessToken,
  setRefreshToken,
  getAccessToken,
  getRefreshToken,
} from "./api";
import { User, Role } from "./types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (nationalId: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  fullName: string;
  nationalId: string;
  jobTitle: string;
  role: "CUSTOMER" | "COWORKER" | "MARKETER";
  password: string;
  phone: string;
  city: string;
  province: string;
  referralCode?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api<User>("/api/auth/me");
      setUser(data);
    } catch {
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (nationalId: string, password: string) => {
    const data = await api<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ nationalId, password }),
    });

    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
    redirectByRole(data.user.role);
  };

  const register = async (formData: RegisterData) => {
    const data = await api<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(formData),
    });

    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
    redirectByRole(data.user.role);
  };

  const logout = async () => {
    try {
      await api("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken: getRefreshToken() }),
      });
    } catch {
      // ignore
    }
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    router.push("/login");
  };

  function redirectByRole(role: Role) {
    switch (role) {
      case "ADMIN":
        router.push("/admin");
        break;
      case "MARKETER":
        router.push("/marketer");
        break;
      default:
        router.push("/");
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
