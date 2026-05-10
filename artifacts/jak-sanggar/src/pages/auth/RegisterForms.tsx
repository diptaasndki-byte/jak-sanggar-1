import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BackButton } from "@/components/layout/BackButton";
import { useDb, save, useAuth } from "@/lib/auth";
import { uid, logActivity, refreshFromServer } from "@/lib/store";
import { authApi, type RegisterApiUserBody } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { JenisKesenian, Bank, Legalitas, SanggarUser, PelatihUser, SenimanUser, SewaUser, JenisInstansiSewa, AlamatTerstruktur } from "@/lib/types";
import { MapPin } from "lucide-react";
import { RegionSelector } from "@/components/RegionSelector";
import { formatAlamatWilayah } from "@/lib/regions";

const EMPTY_WILAYAH: AlamatTerstruktur = {};

function isWilayahLengkap(w: AlamatTerstruktur): boolean {
  return Boolean(w.provinsiId && w.kotaId && w.kecamatanId && w.kelurahanId);
}

const KESENIAN: JenisKesenian[] = ["Tari", "Musik", "Teater", "Rupa", "Sastra", "Silat"];
const BANKS: Bank[] = ["BCA", "Mandiri", "DKI", "BRI", "BNI", "BSI", "CIMB"];
const PENDIDIKAN = ["SD", "SMP", "SMA", "D3", "S1", "S2", "S3"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">{title}</h3>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

export function RegisterSanggar() {
  const db = useDb();
  const { setSession } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [f, setF] = useState({
    namaSanggar: "", namaKetua: "", username: "", email: "", password: "",
    legalitas: "Yayasan" as Legalitas, namaBadanHukum: "",
    jenisKesenian: [] as JenisKesenian[],
    alamat: "", lat: 0, lng: 0,
    wilayah: EMPTY_WILAYAH,
    noHp: "",
    bank: "BCA" as Bank, nomor: "", atasNama: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (db.users.some(u => u.username.toLowerCase() === f.username.toLowerCase())) {
      toast({ title: "Username sudah digunakan", variant: "destructive" }); return;
    }
    if (f.jenisKesenian.length === 0) { toast({ title: "Pilih minimal 1 jenis kesenian", variant: "destructive" }); return; }
    if (!isWilayahLengkap(f.wilayah)) {
      toast({ title: "Lengkapi alamat wilayah", description: "Pilih kota, kecamatan, dan kelurahan.", variant: "destructive" }); return;
    }
    const alamatGabungan = formatAlamatWilayah(f.wilayah, f.alamat);
    // Registrasi via API server
    (async () => {
      try {
        const body: RegisterApiUserBody = {
          username: f.username,
          password: f.password,
          role: "sanggar",
          profile: {
            namaSanggar: f.namaSanggar, namaKetua: f.namaKetua,
            legalitas: f.legalitas, namaBadanHukum: f.legalitas !== "Non-Badan Hukum" ? f.namaBadanHukum : undefined,
            jenisKesenian: f.jenisKesenian, alamat: alamatGabungan, wilayah: f.wilayah,
            email: f.email, noHp: f.noHp,
            lat: f.lat || -6.2, lng: f.lng || 106.8,
            rekening: { bank: f.bank, nomor: f.nomor, atasNama: f.atasNama },
            saldo: 0, editCount: 0, editPeriodStart: Date.now(),
          },
        };
        const apiUser = await authApi.register(body);
        await refreshFromServer();
        const localUser: SanggarUser = {
          id: apiUser.id, role: "sanggar", username: apiUser.username, password: "***api***",
          email: f.email, noHp: f.noHp,
          namaSanggar: f.namaSanggar, namaKetua: f.namaKetua,
          legalitas: f.legalitas, namaBadanHukum: f.legalitas !== "Non-Badan Hukum" ? f.namaBadanHukum : undefined,
          jenisKesenian: f.jenisKesenian, alamat: alamatGabungan, wilayah: f.wilayah,
          lat: f.lat || -6.2, lng: f.lng || 106.8,
          rekening: { bank: f.bank, nomor: f.nomor, atasNama: f.atasNama },
          saldo: 0, editCount: 0, editPeriodStart: Date.now(), createdAt: Date.now(),
        };
        setSession(localUser);
        logActivity(localUser.id, "sanggar", "register-sanggar");
        toast({ title: "Pendaftaran berhasil", description: `Selamat datang, ${localUser.namaSanggar}` });
        navigate("/sanggar");
      } catch (err: any) {
        toast({ title: "Gagal mendaftar", description: err.message ?? "Terjadi kesalahan", variant: "destructive" });
      }
    })();
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <BackButton to="/daftar" label="Kembali ke Pilihan Peran" />
        <h1 className="mt-3 font-serif text-3xl">Pendaftaran Sanggar</h1>
        <Card className="mt-6 p-6 sm:p-8">
          <form onSubmit={submit} className="space-y-8">
            <Section title="Identitas Sanggar">
              <Field label="Nama Sanggar" required value={f.namaSanggar} onChange={v => setF({ ...f, namaSanggar: v })} />
              <Field label="Nama Ketua Sanggar" required value={f.namaKetua} onChange={v => setF({ ...f, namaKetua: v })} />
              <div className="space-y-1.5">
                <Label>Legalitas <span className="text-destructive">*</span></Label>
                <Select value={f.legalitas} onValueChange={(v: Legalitas) => setF({ ...f, legalitas: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Yayasan", "PT", "CV", "Non-Badan Hukum"] as Legalitas[]).map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {f.legalitas !== "Non-Badan Hukum" && (
                <Field label="Nama Badan Hukum" required value={f.namaBadanHukum} onChange={v => setF({ ...f, namaBadanHukum: v })} />
              )}
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Jenis Kesenian <span className="text-destructive">*</span></Label>
                <div className="flex gap-4 flex-wrap p-3 border rounded-md">
                  {KESENIAN.map(k => (
                    <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={f.jenisKesenian.includes(k)} onCheckedChange={(c) => {
                        setF({ ...f, jenisKesenian: c ? [...f.jenisKesenian, k] : f.jenisKesenian.filter(x => x !== k) });
                      }} /> {k}
                    </label>
                  ))}
                </div>
              </div>
            </Section>

            <Section title="Akun & Kontak">
              <Field label="Username" required value={f.username} onChange={v => setF({ ...f, username: v })} />
              <Field label="Email" type="email" required value={f.email} onChange={v => setF({ ...f, email: v })} />
              <Field label="Password" type="password" required value={f.password} onChange={v => setF({ ...f, password: v })} />
              <Field label="No. HP / WhatsApp" required value={f.noHp} onChange={v => setF({ ...f, noHp: v })} />
              <RegionSelector
                mode="dki-only"
                value={f.wilayah}
                onChange={(w) => setF((prev) => ({ ...prev, wilayah: w }))}
                required
              />
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Alamat Detail (Jalan, RT/RW, No.) <span className="text-destructive">*</span></Label>
                <Textarea required rows={2} value={f.alamat} onChange={e => setF({ ...f, alamat: e.target.value })} placeholder="Jl. Mawar No. 12, RT 03/RW 05" />
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => {
                  setF({ ...f, lat: -6.2 + Math.random() * 0.1, lng: 106.8 + Math.random() * 0.1 });
                  toast({ title: "Lokasi berhasil dibagikan", description: "Koordinat tersimpan." });
                }}><MapPin className="h-4 w-4" /> Bagikan Lokasi (Maps)</Button>
                {f.lat !== 0 && <div className="text-xs text-muted-foreground">Koordinat: {f.lat.toFixed(4)}, {f.lng.toFixed(4)}</div>}
              </div>
            </Section>

            <Section title="Data Rekening Sanggar">
              <div className="space-y-1.5">
                <Label>Nama Bank</Label>
                <Select value={f.bank} onValueChange={(v: Bank) => setF({ ...f, bank: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Field label="Nomor Rekening" required value={f.nomor} onChange={v => setF({ ...f, nomor: v })} />
              <Field label="Atas Nama Rekening" required value={f.atasNama} onChange={v => setF({ ...f, atasNama: v })} />
            </Section>

            <div className="flex justify-between gap-2 pt-4 border-t">
              <BackButton to="/daftar" />
              <Button type="submit" data-testid="button-submit-register">Daftarkan Sanggar</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

export function RegisterPelatih() { return <RegisterMember kind="pelatih" />; }
export function RegisterSeniman() { return <RegisterMember kind="seniman" />; }

function RegisterMember({ kind }: { kind: "pelatih" | "seniman" }) {
  const db = useDb();
  const { setSession } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const sanggarList = db.users.filter(u => u.role === "sanggar") as SanggarUser[];
  const [f, setF] = useState({
    nama: "", nikKtp: "", username: "", email: "", password: "", noHp: "",
    usia: 25, pendidikan: "S1", jenisKesenian: "Tari" as JenisKesenian,
    sanggarId: sanggarList[0]?.id ?? "",
    alamatDetail: "",
    wilayah: EMPTY_WILAYAH,
    bank: "BCA" as Bank, nomor: "", atasNama: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const nikKtp = f.nikKtp.replace(/\D/g, "");
    if (db.users.some(u => u.username.toLowerCase() === f.username.toLowerCase())) {
      toast({ title: "Username sudah digunakan", variant: "destructive" }); return;
    }
    if (kind === "seniman") {
      if (!/^\d{16}$/.test(nikKtp)) {
        toast({ title: "NIK KTP tidak valid", description: "NIK KTP wajib berisi tepat 16 angka.", variant: "destructive" }); return;
      }
      const alreadyRegistered = db.users.some(u =>
        u.role === "seniman" && (u as SenimanUser).nikKtp === nikKtp && u.status !== "ditolak" && u.status !== "keluar"
      );
      if (alreadyRegistered) {
        toast({ title: "NIK KTP sudah terdaftar", description: "Seniman tidak dapat mendaftarkan diri di lebih dari 1 sanggar.", variant: "destructive" }); return;
      }
    }
    if (!isWilayahLengkap(f.wilayah)) {
      toast({ title: "Lengkapi alamat wilayah", description: "Pilih kota, kecamatan, dan kelurahan.", variant: "destructive" }); return;
    }
    const alamatGabungan = formatAlamatWilayah(f.wilayah, f.alamatDetail);
    const base = {
      id: uid(), username: f.username, password: f.password, email: f.email, noHp: f.noHp,
      nama: f.nama, usia: Number(f.usia), pendidikan: f.pendidikan,
      jenisKesenian: f.jenisKesenian, sanggarId: f.sanggarId,
      alamat: alamatGabungan, wilayah: f.wilayah,
      status: "pending" as const,
      rekening: { bank: f.bank, nomor: f.nomor, atasNama: f.atasNama },
      createdAt: Date.now(),
    };
    // Registrasi via API server
    (async () => {
      try {
        const profileData: Record<string, unknown> = {
          nama: f.nama, usia: Number(f.usia), pendidikan: f.pendidikan,
          jenisKesenian: f.jenisKesenian, sanggarId: f.sanggarId,
          alamat: alamatGabungan, wilayah: f.wilayah,
          email: f.email, noHp: f.noHp,
          rekening: { bank: f.bank, nomor: f.nomor, atasNama: f.atasNama },
          status: "pending",
        };
        if (kind === "pelatih") profileData.honorPerSesi = db.honorPerSesiDefault;
        if (kind === "seniman") profileData.nikKtp = nikKtp;
        const body: RegisterApiUserBody = {
          username: f.username, password: f.password,
          role: kind, profile: profileData,
        };
        const apiUser = await authApi.register(body);
        await refreshFromServer();
        const newUser = kind === "pelatih"
          ? ({ ...base, id: apiUser.id, role: "pelatih", honorPerSesi: db.honorPerSesiDefault } as PelatihUser)
          : ({ ...base, id: apiUser.id, role: "seniman", nikKtp } as SenimanUser);
        setSession(newUser);
        logActivity(newUser.id, kind, "register");
        toast({ title: "Pendaftaran terkirim", description: "Permohonan gabung dikirim ke Sanggar." });
        navigate(`/${kind}`);
      } catch (err: any) {
        toast({ title: "Gagal mendaftar", description: err.message ?? "Terjadi kesalahan", variant: "destructive" });
      }
    })();
  };

  const title = kind === "pelatih" ? "Pendaftaran Pelatih" : "Pendaftaran Seniman";

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <BackButton to="/daftar" label="Kembali ke Pilihan Peran" />
        <h1 className="mt-3 font-serif text-3xl">{title}</h1>
        <Card className="mt-6 p-6 sm:p-8">
          <form onSubmit={submit} className="space-y-8">
            <Section title="Identitas">
              <Field label="Nama Lengkap" required value={f.nama} onChange={v => setF({ ...f, nama: v })} />
              {kind === "seniman" && (
                <Field
                  label="NIK KTP (16 angka)"
                  required
                  inputMode="numeric"
                  maxLength={16}
                  pattern="\d{16}"
                  value={f.nikKtp}
                  onChange={v => setF({ ...f, nikKtp: v.replace(/\D/g, "").slice(0, 16) })}
                />
              )}
              <Field label="Usia" type="number" required value={String(f.usia)} onChange={v => setF({ ...f, usia: Number(v) })} />
              <div className="space-y-1.5">
                <Label>Pendidikan Terakhir</Label>
                <Select value={f.pendidikan} onValueChange={v => setF({ ...f, pendidikan: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PENDIDIKAN.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Jenis Kesenian</Label>
                <Select value={f.jenisKesenian} onValueChange={(v: JenisKesenian) => setF({ ...f, jenisKesenian: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{KESENIAN.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </Section>

            <Section title="Akun & Kontak">
              <Field label="Username" required value={f.username} onChange={v => setF({ ...f, username: v })} />
              <Field label="Email" type="email" required value={f.email} onChange={v => setF({ ...f, email: v })} />
              <Field label="Password" type="password" required value={f.password} onChange={v => setF({ ...f, password: v })} />
              <Field label="No. HP / WhatsApp" required value={f.noHp} onChange={v => setF({ ...f, noHp: v })} />
            </Section>

            <Section title="Alamat (DKI Jakarta)">
              <RegionSelector
                mode="dki-only"
                value={f.wilayah}
                onChange={(w) => setF((prev) => ({ ...prev, wilayah: w }))}
                required
              />
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Alamat Detail (Jalan, RT/RW, No.) <span className="text-destructive">*</span></Label>
                <Textarea required rows={2} value={f.alamatDetail} onChange={e => setF({ ...f, alamatDetail: e.target.value })} placeholder="Jl. Mawar No. 12, RT 03/RW 05" />
              </div>
            </Section>

            <Section title="Pilih Sanggar">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Sanggar Tujuan</Label>
                <Select value={f.sanggarId} onValueChange={v => setF({ ...f, sanggarId: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih sanggar..." /></SelectTrigger>
                  <SelectContent>
                    {sanggarList.map(s => <SelectItem key={s.id} value={s.id}>{s.namaSanggar} — {s.alamat}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Permohonan gabung Anda akan dikirim ke dasbor Sanggar untuk divalidasi.</p>
              </div>
            </Section>

            <Section title="Data Rekening Pribadi">
              <div className="space-y-1.5">
                <Label>Nama Bank</Label>
                <Select value={f.bank} onValueChange={(v: Bank) => setF({ ...f, bank: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Field label="Nomor Rekening" required value={f.nomor} onChange={v => setF({ ...f, nomor: v })} />
              <Field label="Atas Nama" required value={f.atasNama} onChange={v => setF({ ...f, atasNama: v })} />
            </Section>

            <div className="flex justify-between gap-2 pt-4 border-t">
              <BackButton to="/daftar" />
              <Button type="submit">Daftar</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

const JENIS_INSTANSI: JenisInstansiSewa[] = ["Pusat", "Daerah", "SKPD", "UKPD"];

const JENIS_INSTANSI_DESC: Record<JenisInstansiSewa, string> = {
  Pusat: "Kementerian / lembaga pemerintah pusat",
  Daerah: "Pemerintah Provinsi / Kabupaten / Kota",
  SKPD: "Satuan Kerja Perangkat Daerah",
  UKPD: "Unit Kerja Perangkat Daerah",
};

export function RegisterSewa() {
  const db = useDb();
  const { setSession } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [f, setF] = useState({
    nama: "", username: "", email: "", password: "", noHp: "",
    alamatDetail: "",
    wilayah: EMPTY_WILAYAH,
    jenisInstansi: "Pusat" as JenisInstansiSewa,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.nama.trim() || !f.username.trim() || f.password.length < 6) {
      toast({ title: "Lengkapi data", description: "Nama, username, dan sandi (≥6 karakter) wajib.", variant: "destructive" });
      return;
    }
    if (db.users.some(u => u.username.toLowerCase() === f.username.toLowerCase())) {
      toast({ title: "Username sudah digunakan", variant: "destructive" }); return;
    }
    if (!isWilayahLengkap(f.wilayah)) {
      toast({ title: "Lengkapi alamat wilayah", description: "Pilih provinsi, kota, kecamatan, dan kelurahan.", variant: "destructive" }); return;
    }
    const alamatGabungan = formatAlamatWilayah(f.wilayah, f.alamatDetail);
    // Registrasi sewa — tetap lokal karena role sewa belum didukung API auth
    // Tapi juga push ke server untuk persistensi
    (async () => {
      try {
        const newUser: SewaUser = {
          id: uid(),
          role: "sewa",
          username: f.username.trim(),
          password: f.password,
          email: f.email.trim() || undefined,
          noHp: f.noHp.trim() || undefined,
          nama: f.nama.trim(),
          alamat: alamatGabungan || undefined,
          wilayah: f.wilayah,
          jenisInstansi: f.jenisInstansi,
          createdAt: Date.now(),
        };
        save(d => { d.users.push(newUser); });
        logActivity(newUser.id, "sewa", "register");
        setSession(newUser);
        toast({ title: "Akun siap pakai", description: "Telusuri katalog jasa kesenian sekarang." });
        navigate("/sewa");
      } catch (err: any) {
        toast({ title: "Gagal mendaftar", description: err.message ?? "Terjadi kesalahan", variant: "destructive" });
      }
    })();
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <BackButton to="/daftar" label="Kembali ke Pilihan Peran" />
        <h1 className="mt-3 font-serif text-3xl">Pendaftaran Sewa Jasa</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Akun untuk pemesan jasa: telusuri katalog SDM, perlengkapan, kostum, dan tempat latihan dari sanggar manapun.
        </p>
        <Card className="mt-6 p-6 sm:p-8">
          <form onSubmit={submit} className="space-y-8">
            <Section title="Identitas Pemesan">
              <Field label="Nama Lengkap / Instansi" required value={f.nama} onChange={v => setF({ ...f, nama: v })} />
              <div className="space-y-1.5">
                <Label>Jenis Instansi <span className="text-destructive">*</span></Label>
                <Select value={f.jenisInstansi} onValueChange={(v) => setF({ ...f, jenisInstansi: v as JenisInstansiSewa })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {JENIS_INSTANSI.map(j => (
                      <SelectItem key={j} value={j}>{j}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">{JENIS_INSTANSI_DESC[f.jenisInstansi]}</p>
              </div>
            </Section>

            <Section title="Alamat (Seluruh Indonesia)">
              <RegionSelector
                mode="all-id"
                value={f.wilayah}
                onChange={(w) => setF((prev) => ({ ...prev, wilayah: w }))}
                required
              />
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Alamat Detail (Jalan, RT/RW, No.) <span className="text-destructive">*</span></Label>
                <Textarea required rows={2} value={f.alamatDetail} onChange={e => setF({ ...f, alamatDetail: e.target.value })} placeholder="Jl. Sudirman No. 21" />
              </div>
            </Section>

            <Section title="Akun & Kontak">
              <Field label="Username" required value={f.username} onChange={v => setF({ ...f, username: v })} />
              <Field label="Email" type="email" value={f.email} onChange={v => setF({ ...f, email: v })} />
              <Field label="Password (≥6 karakter)" type="password" required value={f.password} onChange={v => setF({ ...f, password: v })} />
              <Field label="No. HP / WhatsApp" value={f.noHp} onChange={v => setF({ ...f, noHp: v })} />
            </Section>

            <div className="flex justify-between gap-2 pt-4 border-t">
              <BackButton to="/daftar" />
              <Button type="submit">Daftar</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required, type = "text", inputMode, maxLength, pattern }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; maxLength?: number; pattern?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label} {required && <span className="text-destructive">*</span>}</Label>
      <Input type={type} inputMode={inputMode} maxLength={maxLength} pattern={pattern} value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}
