import { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlamatWilayah,
  DKI_PROVINCE_ID,
  DKI_PROVINCE_NAME,
  Wilayah,
  fetchDistricts,
  fetchProvinces,
  fetchRegencies,
  fetchVillages,
} from "@/lib/regions";
import { Loader2 } from "lucide-react";

interface Props {
  /**
   * "all-id"   : pilih provinsi bebas seluruh Indonesia.
   * "dki-only" : sebelumnya provinsi dikunci ke DKI Jakarta. Sekarang tetap
   *              dibuka agar user dapat memilih provinsi / kota / kecamatan /
   *              kelurahan secara manual.
   */
  mode: "all-id" | "dki-only";
  value: AlamatWilayah;
  onChange: (next: AlamatWilayah) => void;
  required?: boolean;
}

export function RegionSelector({ mode, value, onChange, required }: Props) {
  const [provinces, setProvinces] = useState<Wilayah[]>([]);
  const [regencies, setRegencies] = useState<Wilayah[]>([]);
  const [districts, setDistricts] = useState<Wilayah[]>([]);
  const [villages, setVillages] = useState<Wilayah[]>([]);
  const [loading, setLoading] = useState<{
    prov?: boolean;
    reg?: boolean;
    dis?: boolean;
    vil?: boolean;
  }>({});
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Hindari "echo" — onChange di sini akan men-update state luar yang
  // langsung memicu effect lagi. Pakai ref untuk akses callback terbaru
  // tanpa menjadikan onChange sebagai dependency effect (yang akan memicu
  // refetch setiap parent render karena onChange biasanya inline lambda).
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;

  // 1) Provinces — dipicu hanya saat `mode` berubah.
  useEffect(() => {
    const ctrl = new AbortController();

    // Mode dki-only tidak lagi mengunci provinsi. Daftar provinsi tetap dimuat
    // agar user dapat memilih wilayah secara manual.
    if (false && mode === "dki-only") {
      const dki: Wilayah = { id: DKI_PROVINCE_ID, name: DKI_PROVINCE_NAME };
      setProvinces([dki]);
      if (valueRef.current.provinsiId !== DKI_PROVINCE_ID) {
        onChangeRef.current({
          provinsi: DKI_PROVINCE_NAME,
          provinsiId: DKI_PROVINCE_ID,
          kota: undefined,
          kotaId: undefined,
          kecamatan: undefined,
          kecamatanId: undefined,
          kelurahan: undefined,
          kelurahanId: undefined,
        });
      }
      return () => ctrl.abort();
    }

    setLoading((s) => ({ ...s, prov: true }));
    fetchProvinces(ctrl.signal)
      .then((rows) => {
        setProvinces(rows);
        setErrMsg(null);
      })
      .catch((e) => {
        if ((e as Error).name === "AbortError") return;
        setErrMsg("Gagal memuat daftar provinsi. Periksa koneksi internet.");
      })
      .finally(() => setLoading((s) => ({ ...s, prov: false })));
    return () => ctrl.abort();
  }, [mode]);

  // 2) Regencies — depends on selected province
  useEffect(() => {
    const provId = value.provinsiId;
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    if (!provId) return;
    const ctrl = new AbortController();
    setLoading((s) => ({ ...s, reg: true }));
    fetchRegencies(provId, ctrl.signal)
      .then((rows) => {
        setRegencies(rows);
        setErrMsg(null);
      })
      .catch((e) => {
        if ((e as Error).name === "AbortError") return;
        setErrMsg("Gagal memuat daftar kota/kabupaten.");
      })
      .finally(() => setLoading((s) => ({ ...s, reg: false })));
    return () => ctrl.abort();
  }, [value.provinsiId]);

  // 3) Districts
  useEffect(() => {
    const regId = value.kotaId;
    setDistricts([]);
    setVillages([]);
    if (!regId) return;
    const ctrl = new AbortController();
    setLoading((s) => ({ ...s, dis: true }));
    fetchDistricts(regId, ctrl.signal)
      .then((rows) => {
        setDistricts(rows);
        setErrMsg(null);
      })
      .catch((e) => {
        if ((e as Error).name === "AbortError") return;
        setErrMsg("Gagal memuat daftar kecamatan.");
      })
      .finally(() => setLoading((s) => ({ ...s, dis: false })));
    return () => ctrl.abort();
  }, [value.kotaId]);

  // 4) Villages
  useEffect(() => {
    const disId = value.kecamatanId;
    setVillages([]);
    if (!disId) return;
    const ctrl = new AbortController();
    setLoading((s) => ({ ...s, vil: true }));
    fetchVillages(disId, ctrl.signal)
      .then((rows) => {
        setVillages(rows);
        setErrMsg(null);
      })
      .catch((e) => {
        if ((e as Error).name === "AbortError") return;
        setErrMsg("Gagal memuat daftar kelurahan/desa.");
      })
      .finally(() => setLoading((s) => ({ ...s, vil: false })));
    return () => ctrl.abort();
  }, [value.kecamatanId]);

  const isProvinceLocked = false;

  const star = required ? <span className="text-destructive">*</span> : null;

  const provHelp = useMemo(() => {
    if (isProvinceLocked) return "Otomatis terkunci untuk wilayah DKI Jakarta.";
    return undefined;
  }, [isProvinceLocked]);

  return (
    <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4">
      {/* Provinsi */}
      <div className="space-y-1.5">
        <Label>Provinsi {star}</Label>
        <Select
          value={value.provinsiId ?? ""}
          disabled={loading.prov}
          onValueChange={(id) => {
            const p = provinces.find((x) => x.id === id);
            onChange({
              provinsi: p?.name,
              provinsiId: p?.id,
              kota: undefined,
              kotaId: undefined,
              kecamatan: undefined,
              kecamatanId: undefined,
              kelurahan: undefined,
              kelurahanId: undefined,
            });
          }}
        >
          <SelectTrigger>
            {loading.prov ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat…
              </span>
            ) : (
              <SelectValue placeholder="Pilih provinsi" />
            )}
          </SelectTrigger>
          <SelectContent>
            {provinces.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {provHelp && (
          <p className="text-[11px] text-muted-foreground">{provHelp}</p>
        )}
      </div>

      {/* Kota / Kabupaten */}
      <div className="space-y-1.5">
        <Label>Kota / Kabupaten {star}</Label>
        <Select
          value={value.kotaId ?? ""}
          disabled={!value.provinsiId || loading.reg}
          onValueChange={(id) => {
            const r = regencies.find((x) => x.id === id);
            onChange({
              ...value,
              kota: r?.name,
              kotaId: r?.id,
              kecamatan: undefined,
              kecamatanId: undefined,
              kelurahan: undefined,
              kelurahanId: undefined,
            });
          }}
        >
          <SelectTrigger>
            {loading.reg ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat…
              </span>
            ) : (
              <SelectValue placeholder="Pilih kota/kabupaten" />
            )}
          </SelectTrigger>
          <SelectContent>
            {regencies.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kecamatan */}
      <div className="space-y-1.5">
        <Label>Kecamatan {star}</Label>
        <Select
          value={value.kecamatanId ?? ""}
          disabled={!value.kotaId || loading.dis}
          onValueChange={(id) => {
            const d = districts.find((x) => x.id === id);
            onChange({
              ...value,
              kecamatan: d?.name,
              kecamatanId: d?.id,
              kelurahan: undefined,
              kelurahanId: undefined,
            });
          }}
        >
          <SelectTrigger>
            {loading.dis ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat…
              </span>
            ) : (
              <SelectValue placeholder="Pilih kecamatan" />
            )}
          </SelectTrigger>
          <SelectContent>
            {districts.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kelurahan / Desa */}
      <div className="space-y-1.5">
        <Label>Kelurahan / Desa {star}</Label>
        <Select
          value={value.kelurahanId ?? ""}
          disabled={!value.kecamatanId || loading.vil}
          onValueChange={(id) => {
            const v = villages.find((x) => x.id === id);
            onChange({
              ...value,
              kelurahan: v?.name,
              kelurahanId: v?.id,
            });
          }}
        >
          <SelectTrigger>
            {loading.vil ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat…
              </span>
            ) : (
              <SelectValue placeholder="Pilih kelurahan/desa" />
            )}
          </SelectTrigger>
          <SelectContent>
            {villages.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {errMsg && (
        <p className="sm:col-span-2 text-xs text-destructive">{errMsg}</p>
      )}
    </div>
  );
}
