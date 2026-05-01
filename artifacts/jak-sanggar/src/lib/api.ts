// Tipis: helper fetch yang otomatis sertakan cookie sesi & error handling.
// Akan dipakai modul lain di Tahap 2+ saat dipindahkan dari localStorage ke API.

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, payload: unknown, message: string) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type") && typeof init.body === "string") {
    headers.set("content-type", "application/json");
  }
  if (!headers.has("accept")) {
    headers.set("accept", "application/json");
  }
  const res = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
  });
  const ct = res.headers.get("content-type") ?? "";
  let payload: unknown = null;
  if (res.status !== 204 && res.status !== 205) {
    if (ct.includes("application/json")) {
      try { payload = await res.json(); } catch { payload = null; }
    } else {
      try { payload = await res.text(); } catch { payload = null; }
    }
  }
  if (!res.ok) {
    const msg =
      (payload && typeof payload === "object" && "error" in (payload as Record<string, unknown>)
        ? String((payload as { error: unknown }).error)
        : `HTTP ${res.status}`);
    throw new ApiError(res.status, payload, msg);
  }
  return payload as T;
}

export interface ApiAuthUser {
  id: string;
  username: string;
  role: "kurator" | "admin" | "juri" | "sanggar" | "pelatih" | "seniman";
  status: string;
  profile: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const authApi = {
  login: (username: string, password: string) =>
    apiFetch<ApiAuthUser>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () =>
    apiFetch<null>("/api/auth/logout", { method: "POST" }),
  me: () => apiFetch<ApiAuthUser>("/api/auth/me"),
};

export interface CreateApiUserBody {
  username: string;
  password: string;
  role: ApiAuthUser["role"];
  status?: string;
  profile?: Record<string, unknown>;
}

export interface UpdateApiUserBody {
  password?: string;
  status?: string;
  profile?: Record<string, unknown>;
}

export const usersApi = {
  list: () => apiFetch<ApiAuthUser[]>("/api/users"),
  create: (body: CreateApiUserBody) =>
    apiFetch<ApiAuthUser>("/api/users", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: UpdateApiUserBody) =>
    apiFetch<ApiAuthUser>(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  remove: (id: string) =>
    apiFetch<null>(`/api/users/${id}`, { method: "DELETE" }),
};
