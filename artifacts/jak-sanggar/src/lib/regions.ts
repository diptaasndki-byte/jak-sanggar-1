// Helper data wilayah Indonesia.
// Sumber: API publik Emsifa (https://github.com/emsifa/api-wilayah-indonesia)
// — endpoint statis di GitHub Pages, mendukung CORS, tanpa auth.
//
// Skema id (BPS):
//   province  : 2 digit  (DKI Jakarta = "31")
//   regency   : 4 digit  (kota/kabupaten)
//   district  : 7 digit  (kecamatan)
//   village   : 10 digit (kelurahan/desa)

export interface Wilayah {
  id: string;
  name: string;
}

const BASE = "https://www.emsifa.com/api-wilayah-indonesia/api";

export const DKI_PROVINCE_ID = "31";
export const DKI_PROVINCE_NAME = "DKI JAKARTA";

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Gagal memuat wilayah (${res.status})`);
  return (await res.json()) as T;
}

export function fetchProvinces(signal?: AbortSignal): Promise<Wilayah[]> {
  return fetchJson<Wilayah[]>(`${BASE}/provinces.json`, signal);
}

export function fetchRegencies(
  provinceId: string,
  signal?: AbortSignal,
): Promise<Wilayah[]> {
  return fetchJson<Wilayah[]>(`${BASE}/regencies/${provinceId}.json`, signal);
}

export function fetchDistricts(
  regencyId: string,
  signal?: AbortSignal,
): Promise<Wilayah[]> {
  return fetchJson<Wilayah[]>(`${BASE}/districts/${regencyId}.json`, signal);
}

export function fetchVillages(
  districtId: string,
  signal?: AbortSignal,
): Promise<Wilayah[]> {
  return fetchJson<Wilayah[]>(`${BASE}/villages/${districtId}.json`, signal);
}

export interface AlamatWilayah {
  provinsi?: string;
  provinsiId?: string;
  kota?: string;
  kotaId?: string;
  kecamatan?: string;
  kecamatanId?: string;
  kelurahan?: string;
  kelurahanId?: string;
}

export function formatAlamatWilayah(
  w: AlamatWilayah | undefined,
  detail?: string,
): string {
  if (!w) return detail ?? "";
  const parts = [
    detail?.trim(),
    w.kelurahan,
    w.kecamatan,
    w.kota,
    w.provinsi,
  ].filter(Boolean);
  return parts.join(", ");
}
