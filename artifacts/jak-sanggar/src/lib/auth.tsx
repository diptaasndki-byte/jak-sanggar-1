import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { load, save, subscribe, logActivity } from "./store";
import type { AnyUser, Role } from "./types";
import { authApi, ApiError, type ApiAuthUser } from "./api";

const SESSION_KEY = "jaksanggar_session_v1";
const IMPERSONATION_KEY = "jaksanggar_impersonation_v1";

interface ImpersonationState {
  originalUserId: string;
  impersonatedUserId: string;
}

function readImpersonation(): ImpersonationState | null {
  try {
    const raw = localStorage.getItem(IMPERSONATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ImpersonationState;
    if (!parsed.originalUserId || !parsed.impersonatedUserId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeImpersonation(s: ImpersonationState | null) {
  if (s) localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(s));
  else localStorage.removeItem(IMPERSONATION_KEY);
}

interface AuthCtx {
  user: AnyUser | null;
  ready: boolean;
  /** ID asli kurator saat sedang impersonate; null kalau tidak impersonate. */
  impersonatedFromId: string | null;
  login: (username: string, password: string) => Promise<AnyUser | null>;
  logout: () => Promise<void>;
  setSession: (u: AnyUser) => void;
  /** Switch UI to act as another user. Original kurator id disimpan agar bisa kembali. */
  impersonate: (targetUserId: string) => boolean;
  /** Kembali ke akun kurator semula. */
  stopImpersonation: () => boolean;
  refresh: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

// Cocokkan user yang dikembalikan API ke entry user di local store.
// PENTING: id user di localStorage TIDAK diubah supaya seluruh foreign-key
// di store (latihan, iuran, kas, kurasi, pengajuan honor, distribusi, dll)
// tetap utuh. Sesi otentikasi sepenuhnya server-side (cookie HttpOnly),
// jadi `api.id` hanya dipakai server. Local id tetap jadi kunci UI.
// Bila user belum ada di local store (mis. dibuat via API), buat entry
// minimal — Tahap 2+ akan menangani semua modul dari server.
function reconcileLocalUser(api: ApiAuthUser): AnyUser {
  const db = load();
  const byUsername = db.users.find(
    (u) => u.username.toLowerCase() === api.username.toLowerCase(),
  );
  if (byUsername) {
    return byUsername;
  }
  // Buat entry minimal sesuai role. Pakai id baru lokal supaya tidak bentrok
  // dengan id lama; relasi store akan menyusul saat user mengisi modul-modul
  // yang relevan.
  const profile = api.profile ?? {};
  const localId = `u_api_${api.id}`;
  const base = {
    id: localId,
    username: api.username,
    password: "***api***",
    createdAt: Date.now(),
  };
  let nu: AnyUser;
  switch (api.role as Role) {
    case "kurator":
      nu = { ...base, role: "kurator" } as AnyUser;
      break;
    case "admin":
      nu = {
        ...base,
        role: "admin",
        nama: String(profile["nama"] ?? api.username),
        permissions: {
          kelolaBerita: true, kelolaBanner: true, kelolaSlider: true,
          kelolaJamPembinaan: false, kelolaInfoBudaya: true,
        },
      } as AnyUser;
      break;
    case "juri":
      nu = {
        ...base,
        role: "juri",
        nama: String(profile["nama"] ?? api.username),
        keahlian: String(profile["keahlian"] ?? "Umum"),
      } as AnyUser;
      break;
    case "sanggar":
      nu = {
        ...base,
        role: "sanggar",
        namaSanggar: String(profile["namaSanggar"] ?? api.username),
        namaKetua: String(profile["namaKetua"] ?? "-"),
        legalitas: "Non-Badan Hukum",
        jenisKesenian: ["Tari"],
        alamat: String(profile["alamat"] ?? "-"),
        rekening: { bank: "BCA", nomor: "-", atasNama: "-" },
        saldo: 0,
        editCount: 0,
        editPeriodStart: Date.now(),
      } as AnyUser;
      break;
    case "pelatih":
      nu = {
        ...base,
        role: "pelatih",
        nama: String(profile["nama"] ?? api.username),
        usia: 30,
        pendidikan: "-",
        jenisKesenian: "Tari",
        status: "aktif",
        rekening: { bank: "BCA", nomor: "-", atasNama: "-" },
        honorPerSesi: 0,
      } as AnyUser;
      break;
    case "seniman":
      nu = {
        ...base,
        role: "seniman",
        nama: String(profile["nama"] ?? api.username),
        usia: 25,
        pendidikan: "-",
        jenisKesenian: "Tari",
        status: "aktif",
        rekening: { bank: "BCA", nomor: "-", atasNama: "-" },
      } as AnyUser;
      break;
    default:
      nu = { ...base, role: "kurator" } as AnyUser;
  }
  save((d) => { d.users.push(nu); });
  return nu;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AnyUser | null>(null);
  const [ready, setReady] = useState(false);
  const [impersonatedFromId, setImpersonatedFromId] = useState<string | null>(
    () => readImpersonation()?.originalUserId ?? null,
  );
  // Versi state auth — dinaikkan setiap kali login/logout terjadi supaya
  // hidrasi awal yang lambat tidak menimpa state baru.
  const stateVersionRef = useRef(0);

  // Hidrasi awal: cek sesi server. Jika impersonation aktif & user asli adalah
  // kurator, restore user impersonasi setelah cocokkan kurator dari API.
  useEffect(() => {
    let cancelled = false;
    const initialVersion = stateVersionRef.current;
    (async () => {
      try {
        const me = await authApi.me();
        if (cancelled || stateVersionRef.current !== initialVersion) return;
        const local = reconcileLocalUser(me);
        const imp = readImpersonation();
        if (imp && imp.originalUserId === local.id && local.role === "kurator") {
          const target = load().users.find((u) => u.id === imp.impersonatedUserId);
          if (target) {
            localStorage.setItem(SESSION_KEY, target.id);
            setUser(target);
            setImpersonatedFromId(local.id);
            return;
          }
          // Target hilang — bersihkan impersonation.
          writeImpersonation(null);
          setImpersonatedFromId(null);
        }
        localStorage.setItem(SESSION_KEY, local.id);
        setUser(local);
        if (imp && imp.originalUserId !== local.id) {
          // Impersonation ditinggalkan oleh user lain — bersihkan.
          writeImpersonation(null);
          setImpersonatedFromId(null);
        }
      } catch (err) {
        if (cancelled || stateVersionRef.current !== initialVersion) return;
        if (!(err instanceof ApiError) || err.status !== 401) {
          console.warn("auth.me gagal", err);
        }
        localStorage.removeItem(SESSION_KEY);
        writeImpersonation(null);
        setImpersonatedFromId(null);
        setUser(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Sinkronkan user ketika store berubah (mis. profil di-update di tab lain).
  useEffect(() => {
    const unsub = subscribe(() => {
      const id = localStorage.getItem(SESSION_KEY);
      if (!id) { setUser(null); return; }
      const fresh = load().users.find((u) => u.id === id) ?? null;
      setUser(fresh);
    });
    return () => { unsub(); };
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const api = await authApi.login(username.trim(), password);
      // Naikkan versi state supaya hidrasi awal me() yang lambat tidak
      // menimpa hasil login ini bila baru kembali setelahnya.
      stateVersionRef.current += 1;
      // Login baru → bersihkan impersonation lama (mencegah stale state).
      writeImpersonation(null);
      setImpersonatedFromId(null);
      const local = reconcileLocalUser(api);
      localStorage.setItem(SESSION_KEY, local.id);
      setUser(local);
      setReady(true);
      logActivity(local.id, local.role, "login");
      return local;
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
        return null;
      }
      throw err;
    }
  };

  const logout = async () => {
    if (user) logActivity(user.id, user.role, "logout");
    try { await authApi.logout(); } catch { /* abaikan */ }
    stateVersionRef.current += 1;
    localStorage.removeItem(SESSION_KEY);
    writeImpersonation(null);
    setImpersonatedFromId(null);
    setUser(null);
  };

  const setSession = (u: AnyUser) => {
    localStorage.setItem(SESSION_KEY, u.id);
    setUser(u);
  };

  const impersonate = (targetUserId: string): boolean => {
    // Hanya kurator (atau yang sedang impersonate dari kurator) yang boleh.
    const originalId = impersonatedFromId ?? user?.id ?? null;
    if (!originalId) return false;
    const db = load();
    const original = db.users.find((u) => u.id === originalId);
    if (!original || original.role !== "kurator") return false;
    if (targetUserId === originalId) {
      // Diminta "impersonate diri sendiri" — sama seperti stop.
      return stopImpersonation();
    }
    const target = db.users.find((u) => u.id === targetUserId);
    if (!target) return false;
    writeImpersonation({ originalUserId: originalId, impersonatedUserId: targetUserId });
    localStorage.setItem(SESSION_KEY, target.id);
    setImpersonatedFromId(originalId);
    setUser(target);
    logActivity(originalId, "kurator", "impersonate-start", { targetId: targetUserId, targetRole: target.role });
    return true;
  };

  const stopImpersonation = (): boolean => {
    if (!impersonatedFromId) return false;
    const original = load().users.find((u) => u.id === impersonatedFromId);
    if (!original) {
      writeImpersonation(null);
      setImpersonatedFromId(null);
      return false;
    }
    logActivity(original.id, "kurator", "impersonate-stop", { fromUserId: user?.id ?? null });
    writeImpersonation(null);
    localStorage.setItem(SESSION_KEY, original.id);
    setImpersonatedFromId(null);
    setUser(original);
    return true;
  };

  const refresh = () => {
    const id = localStorage.getItem(SESSION_KEY);
    setUser(id ? load().users.find((u) => u.id === id) ?? null : null);
  };

  return (
    <Ctx.Provider value={{ user, ready, impersonatedFromId, login, logout, setSession, impersonate, stopImpersonation, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}

export function useDb() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = subscribe(() => setTick((t) => t + 1));
    return () => { unsub(); };
  }, []);
  return load();
}

export { save, logActivity };
