import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import type { Role, User } from "@/lib/types";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  department?: string;
  studentId?: string;
}

interface AuthValue {
  user: User | null;
  role: Role | null;
  isLoggedIn: boolean;
  /** True while the initial session lookup (GET /auth/me) is in flight. */
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on first load from the httpOnly cookie.
  useEffect(() => {
    let alive = true;
    api.auth
      .me()
      .then(({ user }) => alive && setUser(user))
      .catch(() => alive && setUser(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const { user } = await api.auth.me();
    setUser(user);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await api.auth.login(email, password);
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { user } = await api.auth.register(input);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isLoggedIn: !!user,
      loading,
      login,
      register,
      logout,
      refresh,
    }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
