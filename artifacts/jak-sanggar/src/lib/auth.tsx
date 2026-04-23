import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { load, save, subscribe, logActivity } from "./store";
import type { AnyUser } from "./types";

const SESSION_KEY = "jaksanggar_session_v1";

interface AuthCtx {
  user: AnyUser | null;
  login: (username: string, password: string) => AnyUser | null;
  logout: () => void;
  setSession: (u: AnyUser) => void;
  refresh: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AnyUser | null>(() => {
    if (typeof window === "undefined") return null;
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return null;
    return load().users.find(u => u.id === id) ?? null;
  });

  useEffect(() => {
    const unsub = subscribe(() => {
      const id = localStorage.getItem(SESSION_KEY);
      setUser(id ? load().users.find(u => u.id === id) ?? null : null);
    });
    return () => { unsub(); };
  }, []);

  const login = (username: string, password: string) => {
    const u = load().users.find(x => x.username.toLowerCase() === username.toLowerCase() && x.password === password);
    if (u) {
      localStorage.setItem(SESSION_KEY, u.id);
      setUser(u);
      logActivity(u.id, u.role, "login");
      return u;
    }
    return null;
  };

  const logout = () => {
    if (user) logActivity(user.id, user.role, "logout");
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const setSession = (u: AnyUser) => {
    localStorage.setItem(SESSION_KEY, u.id);
    setUser(u);
  };

  const refresh = () => {
    const id = localStorage.getItem(SESSION_KEY);
    setUser(id ? load().users.find(u => u.id === id) ?? null : null);
  };

  return <Ctx.Provider value={{ user, login, logout, setSession, refresh }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}

export function useDb() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = subscribe(() => setTick(t => t + 1));
    return () => { unsub(); };
  }, []);
  return load();
}

export { save, logActivity };
