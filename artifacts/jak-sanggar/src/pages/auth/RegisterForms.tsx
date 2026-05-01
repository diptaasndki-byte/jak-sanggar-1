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
import { uid, logActivity } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import type { JenisKesenian, Bank, Legalitas, SanggarUser, PelatihUser, SenimanUser, SewaUser } from "@/lib/types";
import { MapPin } from "lucide-react";

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
    noHp: "",
    bank: "BCA" as Bank, nomor: "", atasNama: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (db.users.some(u => u.username.toLowerCase() === f.username.toLowerCase())) {
      toast({ title: "Username sudah digunakan", variant: "destructive" }); return;
    }
    if (f.jenisKesenian.length === 0) { toast({ title: "Pilih minimal 1 jenis kesenian", variant: "destructive" }); return; }
    const newUser: SanggarUser = {
      id: uid(), role: "sanggar", username: f.username, password: f.password, email: f.email, noHp: f.noHp,
      namaSanggar: f.namaSanggar, namaKetua: f.namaKetua,
      legalitas: f.legalitas, namaBadanHukum: f.legalitas !== "Non-Badan Hukum" ? f.namaBadanHukum : undefined,
      jenisKesenian: f.jenisKesenian, alamat: f.alamat, lat: f.lat || -6.2, lng: f.lng || 106.8,
      rekening: { bank: f.bank, nomor: f.nomor, atasNama: f.atasNama },
      saldo: 0, editCount: 0, editPeriodStart: Date.now(), createdAt: Date.now(),
    };
    save(d => { d.users.push(newUser); });
    logActivity(newUser.id, "sanggar", "register-sanggar");
    setSession(newUser);
    toast({ title: "Pendaftaran berhasil", description: `Selamat datang, ${newUser.namaSanggar}` });
    navigate("/sanggar");
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
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Alamat Lengkap <span className="text-destructive">*</span></Label>
                <Textarea required rows={2} value={f.alamat} onChange={e => setF({ ...f, alamat: e.target.value })} placeholder="Jl. ..." />
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
    nama: "", username: "", email: "", password: "", noHp: "",
    usia: 25, pendidikan: "S1", jenisKesenian: "Tari" as JenisKesenian,
    sanggarId: sanggarList[0]?.id ?? "",
    bank: "BCA" as Bank, nomor: "", atasNama: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (db.users.some(u => u.username.toLowerCase() === f.username.toLowerCase())) {
      toast({ title: "Username sudah digunakan", variant: "destructive" }); return;
    }
    const base = {
      id: uid(), username: f.username, password: f.password, email: f.email, noHp: f.noHp,
      nama: f.nama, usia: Number(f.usia), pendidikan: f.pendidikan,
      jenisKesenian: f.jenisKesenian, sanggarId: f.sanggarId,
      status: "pending" as const,
      rekening: { bank: f.bank, nomor: f.nomor, atasNama: f.atasNama },
      createdAt: Date.now(),
    };
    const newUser = kind === "pelatih"
      ? ({ ...base, role: "pelatih", honorPerSesi: db.honorPerSesiDefault } as PelatihUser)
      : ({ ...base, role: "seniman" } as SenimanUser);
    save(d => { d.users.push(newUser); });
    logActivity(newUser.id, kind, "register");
    setSession(newUser);
    toast({ title: "Pendaftaran terkirim", description: "Permohonan gabung dikirim ke Sanggar." });
    navigate(`/${kind}`);
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

const JENIS_INSTANSI: SewaUser["jenisInstansi"][] = ["Pribadi", "Komunitas", "Sekolah", "Korporat", "Pemerintah"];

export function RegisterSewa() {
  const db = useDb();
  const { setSession } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [f, setF] = useState({
    nama: "", username: "", email: "", password: "", noHp: "",
    alamat: "", jenisInstansi: "Pribadi" as NonNullable<SewaUser["jenisInstansi"]>,
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
    const newUser: SewaUser = {
      id: uid(),
      role: "sewa",
      username: f.username.trim(),
      password: f.password,
      email: f.email.trim() || undefined,
      noHp: f.noHp.trim() || undefined,
      nama: f.nama.trim(),
      alamat: f.alamat.trim() || undefined,
      jenisInstansi: f.jenisInstansi,
      createdAt: Date.now(),
    };
    save(d => { d.users.push(newUser); });
    logActivity(newUser.id, "sewa", "register");
    setSession(newUser);
    toast({ title: "Akun siap pakai", description: "Telusuri katalog jasa kesenian sekarang." });
    navigate("/sewa");
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
                <Label>Jenis Instansi</Label>
                <Select value={f.jenisInstansi} onValueChange={(v) => setF({ ...f, jenisInstansi: v as NonNullable<SewaUser["jenisInstansi"]> })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{JENIS_INSTANSI.map(j => <SelectItem key={j!} value={j!}>{j}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Alamat</Label>
                <Textarea rows={2} value={f.alamat} onChange={e => setF({ ...f, alamat: e.target.value })} />
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

function Field({ label, value, onChange, required, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label} {required && <span className="text-destructive">*</span>}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}
