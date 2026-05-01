import { useEffect, useState } from "react";
import { useAuth, useDb } from "@/lib/auth";
import { save, uid, fmtDate, logActivity } from "@/lib/store";
import { usersApi, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { AdminUser, JuriUser, SanggarUser, PelatihUser, SenimanUser, Indikator, Variabel, AdminPermissions, TradisiKategori, TradisiItem, ThemeMode, StudioSettings, AnyUser, Role, Bank, JenisKesenian, Legalitas } from "@/lib/types";
import { Trash2, Eye, FileDown, Plus, Palette, Clock, Shield, X, Crown, Users, GraduationCap, UserCog, Wallet, Image as ImageIcon, Upload, RotateCcw, Type, Sparkles, ScrollText, Languages, Check, Wand2, LayoutTemplate, LogIn } from "lucide-react";
import { useT } from "@/lib/i18n";
import { BRAND_ICON_KEYS, getBrandIcon } from "@/lib/brandIcons";
import { DEFAULT_KATEGORI_COLOR, DEFAULT_TRADISI_POOL } from "@/components/system/TradisiLisanBetawi";
import { Textarea } from "@/components/ui/textarea";
import { PremiumHero } from "@/components/system/PremiumHero";
import { AnimatedCounter } from "@/components/system/AnimatedCounter";
import { NewsSlider } from "@/components/system/NewsSlider";
import { ComposedChart, Bar, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export function KuratorHome() {
  const db = useDb();
  const sanggar = db.users.filter(u => u.role === "sanggar").length;
  const pelatih = db.users.filter(u => u.role === "pelatih").length;
  const seniman = db.users.filter(u => u.role === "seniman").length;
  const totalKas = (db.users.filter(u => u.role === "sanggar") as SanggarUser[]).reduce((s, x) => s + x.saldo, 0);

  // Aggregate cross-system fintech chart: roll up all sanggar kas per date
  const allKas = [...db.kas].sort((a, b) => a.tanggal - b.tanggal);
  const byDate: Record<string, { tgl: string; masuk: number; keluar: number; saldo: number }> = {};
  allKas.forEach(k => {
    const d = new Date(k.tanggal);
    const key = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!byDate[key]) byDate[key] = { tgl: key, masuk: 0, keluar: 0, saldo: 0 };
    byDate[key].masuk += k.debit / 1000;
    byDate[key].keluar += k.kredit / 1000;
  });
  const dates = Object.keys(byDate);
  let runningSaldo = 0;
  const chartData = dates.map(k => {
    runningSaldo += byDate[k].masuk - byDate[k].keluar;
    return { ...byDate[k], saldo: Math.max(0, runningSaldo) };
  });

  return (
    <div>
      <PremiumHero
        eyebrow="Konsol Kurator"
        icon={<Crown className="h-4 w-4" />}
        title="Dasbor Kurator"
        subtitle="Pemantauan dan kontrol penuh atas ekosistem Jak Sanggar — sanggar, pelatih, seniman, hingga arus kas sistem."
        right={
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "hsl(42 70% 70%)" }}>Total Kas Sistem</div>
            <div className="font-serif text-3xl md:text-4xl mt-1 tabular-nums" style={{
              background: "linear-gradient(135deg, hsl(45 90% 82%), hsl(42 75% 55%))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Rp <AnimatedCounter value={totalKas} />
            </div>
          </div>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat icon={<Users className="h-5 w-5" />} label="Sanggar Terdaftar" value={sanggar} />
        <Stat icon={<GraduationCap className="h-5 w-5" />} label="Pelatih" value={pelatih} />
        <Stat icon={<UserCog className="h-5 w-5" />} label="Seniman" value={seniman} />
      </div>

      <div className="mt-6">
        <NewsSlider news={db.news} title="Berita & Pengumuman Sistem" />
      </div>

      {/* Fintech analytics — line + bar combo */}
      <Card className="p-5 mt-6 premium-card">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-serif text-lg flex items-center gap-2"><Wallet className="h-5 w-5 text-accent-foreground" />Arus Kas Sistem</h3>
            <p className="text-xs text-muted-foreground">Akumulasi transaksi seluruh sanggar (dalam ribu Rupiah)</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-6 rounded-sm" style={{ background: "linear-gradient(90deg, hsl(42 75% 55%), hsl(38 60% 42%))", boxShadow: "0 0 6px hsl(42 75% 55% / 0.5)" }} />Saldo</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: "linear-gradient(180deg, hsl(145 55% 50%), hsl(145 55% 38%))" }} />Pemasukan</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: "linear-gradient(180deg, hsl(8 65% 55%), hsl(8 60% 42%))" }} />Pengeluaran</span>
          </div>
        </div>
        <div className="h-72 mt-4">
          {chartData.length === 0 ? (
            <div className="h-full grid place-items-center text-sm text-muted-foreground">Belum ada transaksi tercatat di sistem.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} barGap={2}>
                <defs>
                  <linearGradient id="kuratorMasuk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(145 55% 50%)" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="hsl(145 55% 38%)" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="kuratorKeluar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(8 65% 55%)" stopOpacity={0.92} />
                    <stop offset="100%" stopColor="hsl(8 60% 42%)" stopOpacity={0.65} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="tgl" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--accent) / 0.07)" }}
                  contentStyle={{
                    background: "hsl(var(--popover) / 0.92)",
                    border: "1px solid hsl(var(--accent) / 0.35)",
                    borderRadius: 12,
                    backdropFilter: "blur(14px)",
                    boxShadow: "0 14px 32px -10px hsl(222 50% 10% / 0.35)",
                    padding: "8px 12px",
                  }}
                  labelStyle={{ fontWeight: 600, fontSize: 11 }}
                  itemStyle={{ fontSize: 12 }}
                  formatter={(v: number, n: string) => [`${v.toLocaleString("id-ID")} rb`, n === "masuk" ? "Pemasukan" : n === "keluar" ? "Pengeluaran" : "Saldo Akumulasi"]}
                />
                <Bar dataKey="masuk" fill="url(#kuratorMasuk)" radius={[5, 5, 0, 0]} maxBarSize={28} />
                <Bar dataKey="keluar" fill="url(#kuratorKeluar)" radius={[5, 5, 0, 0]} maxBarSize={28} />
                <Line type="monotone" dataKey="saldo" stroke="hsl(42 75% 55%)" strokeWidth={2.5}
                  dot={{ r: 3, fill: "hsl(42 80% 60%)", stroke: "hsl(38 60% 38%)", strokeWidth: 1 }}
                  activeDot={{ r: 5, fill: "hsl(42 85% 65%)" }}
                  style={{ filter: "drop-shadow(0 0 6px hsl(42 75% 55% / 0.5))" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <div className="mt-6">
        <h3 className="font-serif text-lg mb-3">Aktivitas Terbaru</h3>
        <Card className="p-2">
          <div className="max-h-96 overflow-y-auto scrollbar-thin">
            {db.activity.slice(0, 30).map(a => (
              <div key={a.id} className="flex items-center gap-3 px-3 py-2 text-sm border-b last:border-0">
                <Badge variant="outline" className="text-[10px]">{a.actorRole}</Badge>
                <div className="flex-1">{a.action}</div>
                <div className="text-xs text-muted-foreground">{new Date(a.ts).toLocaleString("id-ID")}</div>
              </div>
            ))}
            {db.activity.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Belum ada aktivitas.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
function Stat({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <Card className="p-5 premium-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-2xl font-serif mt-2 tabular-nums"><AnimatedCounter value={value} /></div>
        </div>
        {icon && <div className="h-10 w-10 rounded-lg grid place-items-center bg-accent/15 border border-accent/30 text-accent-foreground">{icon}</div>}
      </div>
    </Card>
  );
}

type EditableRole = Exclude<Role, "kurator">;
const ROLE_LABEL: Record<Role, string> = {
  kurator: "Kurator",
  admin: "Admin",
  sanggar: "Sanggar",
  pelatih: "Pelatih",
  seniman: "Seniman",
  juri: "Juri",
};
const BANK_OPTIONS: Bank[] = ["BCA", "Mandiri", "DKI", "BRI", "BNI", "BSI", "CIMB"];
const JENIS_OPTIONS: JenisKesenian[] = ["Tari", "Musik", "Teater", "Rupa", "Sastra"];
const LEGALITAS_OPTIONS: Legalitas[] = ["Yayasan", "PT", "CV", "Non-Badan Hukum"];

function getDisplayName(u: AnyUser): string {
  if (u.role === "sanggar") return (u as SanggarUser).namaSanggar;
  if ("nama" in u && typeof (u as { nama?: unknown }).nama === "string") {
    return (u as { nama: string }).nama;
  }
  return u.username;
}

function EditUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AnyUser;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<AnyUser>(user);
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setDraft(user);
      setNewPassword("");
    }
  }, [open, user]);

  const upd = <K extends keyof AnyUser>(key: K, value: unknown) => {
    setDraft((d) => ({ ...d, [key]: value }) as AnyUser);
  };
  const updRekening = (patch: Partial<{ bank: Bank; nomor: string; atasNama: string }>) => {
    setDraft((d) => {
      const base = ("rekening" in d ? (d as { rekening?: { bank: Bank; nomor: string; atasNama: string } }).rekening : null) ?? { bank: "BCA" as Bank, nomor: "", atasNama: "" };
      return { ...d, rekening: { ...base, ...patch } } as AnyUser;
    });
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      // Update local store fully (UI authoritative for profile fields).
      save((db) => {
        db.users = db.users.map((u) => (u.id === draft.id ? { ...draft } : u));
      });
      // Reset password: try API if user has u_api_<id> mapping.
      if (newPassword.trim().length > 0) {
        const apiId = draft.id.startsWith("u_api_") ? draft.id.slice("u_api_".length) : null;
        if (apiId) {
          try {
            await usersApi.update(apiId, { password: newPassword.trim() });
          } catch (err) {
            const msg = err instanceof ApiError ? err.message : "Gagal reset password di server";
            toast({ title: "Gagal reset password", description: msg, variant: "destructive" });
            setBusy(false);
            return;
          }
        } else {
          // Akun lokal saja — perbarui field password lokal (tidak mengubah autentikasi server).
          save((db) => {
            db.users = db.users.map((u) =>
              u.id === draft.id ? ({ ...u, password: newPassword.trim() } as AnyUser) : u,
            );
          });
        }
      }
      logActivity(draft.id, draft.role, "kurator-edit-profil", { byKurator: true });
      toast({
        title: "Akun diperbarui",
        description: newPassword ? "Profil & kata sandi disimpan." : "Profil disimpan.",
      });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const role = draft.role;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {ROLE_LABEL[role]} — {getDisplayName(draft)}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Username</Label>
            <Input
              value={draft.username}
              onChange={(e) => upd("username", e.target.value)}
              data-testid="input-edit-username"
              disabled={draft.id.startsWith("u_api_")}
            />
            {draft.id.startsWith("u_api_") && (
              <p className="text-xs text-muted-foreground mt-1">
                Username terkunci karena akun terhubung ke server (mencegah duplikasi identitas).
              </p>
            )}
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={draft.email ?? ""}
              onChange={(e) => upd("email", e.target.value)}
              data-testid="input-edit-email"
            />
          </div>
          <div>
            <Label>No HP</Label>
            <Input
              value={draft.noHp ?? ""}
              onChange={(e) => upd("noHp", e.target.value)}
              data-testid="input-edit-nohp"
            />
          </div>
          {role === "sanggar" && (
            <>
              <div>
                <Label>Nama Sanggar</Label>
                <Input
                  value={(draft as SanggarUser).namaSanggar}
                  onChange={(e) => upd("namaSanggar" as keyof AnyUser, e.target.value)}
                />
              </div>
              <div>
                <Label>Nama Ketua</Label>
                <Input
                  value={(draft as SanggarUser).namaKetua}
                  onChange={(e) => upd("namaKetua" as keyof AnyUser, e.target.value)}
                />
              </div>
              <div>
                <Label>Legalitas</Label>
                <Select
                  value={(draft as SanggarUser).legalitas}
                  onValueChange={(v) => upd("legalitas" as keyof AnyUser, v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEGALITAS_OPTIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Alamat</Label>
                <Textarea
                  value={(draft as SanggarUser).alamat}
                  onChange={(e) => upd("alamat" as keyof AnyUser, e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label>Tahun Berdiri</Label>
                <Input
                  type="number"
                  value={(draft as SanggarUser).tahunBerdiri ?? ""}
                  onChange={(e) => upd("tahunBerdiri" as keyof AnyUser, Number(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label>NPWP</Label>
                <Input
                  value={(draft as SanggarUser).npwp ?? ""}
                  onChange={(e) => upd("npwp" as keyof AnyUser, e.target.value)}
                />
              </div>
            </>
          )}
          {(role === "pelatih" || role === "seniman") && (
            <>
              <div>
                <Label>Nama</Label>
                <Input
                  value={(draft as PelatihUser | SenimanUser).nama}
                  onChange={(e) => upd("nama" as keyof AnyUser, e.target.value)}
                />
              </div>
              <div>
                <Label>Usia</Label>
                <Input
                  type="number"
                  value={(draft as PelatihUser | SenimanUser).usia}
                  onChange={(e) => upd("usia" as keyof AnyUser, Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Pendidikan</Label>
                <Input
                  value={(draft as PelatihUser | SenimanUser).pendidikan}
                  onChange={(e) => upd("pendidikan" as keyof AnyUser, e.target.value)}
                />
              </div>
              <div>
                <Label>Jenis Kesenian</Label>
                <Select
                  value={(draft as PelatihUser | SenimanUser).jenisKesenian}
                  onValueChange={(v) => upd("jenisKesenian" as keyof AnyUser, v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {JENIS_OPTIONS.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={(draft as PelatihUser | SenimanUser).status}
                  onValueChange={(v) => upd("status" as keyof AnyUser, v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["pending", "aktif", "ditolak", "keluar"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Alamat</Label>
                <Textarea
                  value={(draft as PelatihUser | SenimanUser).alamat ?? ""}
                  onChange={(e) => upd("alamat" as keyof AnyUser, e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label>NPWP</Label>
                <Input
                  value={(draft as PelatihUser | SenimanUser).npwp ?? ""}
                  onChange={(e) => upd("npwp" as keyof AnyUser, e.target.value)}
                />
              </div>
              {role === "pelatih" && (
                <div>
                  <Label>Honor / Sesi</Label>
                  <Input
                    type="number"
                    value={(draft as PelatihUser).honorPerSesi}
                    onChange={(e) => upd("honorPerSesi" as keyof AnyUser, Number(e.target.value) || 0)}
                  />
                </div>
              )}
              {role === "seniman" && (
                <div>
                  <Label>Profesi</Label>
                  <Input
                    value={(draft as SenimanUser).profesi ?? ""}
                    onChange={(e) => upd("profesi" as keyof AnyUser, e.target.value)}
                  />
                </div>
              )}
            </>
          )}
          {role === "juri" && (
            <>
              <div>
                <Label>Nama</Label>
                <Input
                  value={(draft as JuriUser).nama}
                  onChange={(e) => upd("nama" as keyof AnyUser, e.target.value)}
                />
              </div>
              <div>
                <Label>Keahlian</Label>
                <Input
                  value={(draft as JuriUser).keahlian}
                  onChange={(e) => upd("keahlian" as keyof AnyUser, e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Alamat</Label>
                <Textarea
                  value={(draft as JuriUser).alamat ?? ""}
                  onChange={(e) => upd("alamat" as keyof AnyUser, e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}
          {role === "admin" && (
            <div className="md:col-span-2">
              <Label>Nama</Label>
              <Input
                value={(draft as AdminUser).nama}
                onChange={(e) => upd("nama" as keyof AnyUser, e.target.value)}
              />
            </div>
          )}
          {(role === "sanggar" || role === "pelatih" || role === "seniman" || role === "juri") && (
            <>
              <div className="md:col-span-2 mt-2 pt-3 border-t">
                <div className="text-sm font-semibold mb-2">Rekening Bank</div>
              </div>
              <div>
                <Label>Bank</Label>
                <Select
                  value={(("rekening" in draft ? (draft as { rekening?: { bank: Bank } }).rekening?.bank : undefined) ?? "BCA")}
                  onValueChange={(v) => updRekening({ bank: v as Bank })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BANK_OPTIONS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>No Rekening</Label>
                <Input
                  value={("rekening" in draft ? (draft as { rekening?: { nomor: string } }).rekening?.nomor : "") ?? ""}
                  onChange={(e) => updRekening({ nomor: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Atas Nama</Label>
                <Input
                  value={("rekening" in draft ? (draft as { rekening?: { atasNama: string } }).rekening?.atasNama : "") ?? ""}
                  onChange={(e) => updRekening({ atasNama: e.target.value })}
                />
              </div>
            </>
          )}
          <div className="md:col-span-2 mt-2 pt-3 border-t">
            <Label>Reset Kata Sandi (kosongkan jika tidak diubah)</Label>
            <Input
              type="text"
              autoComplete="off"
              placeholder="Sandi baru..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              data-testid="input-edit-newpassword"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimal 6 karakter. Jika akun terhubung server, sandi akan diubah di server.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Batal</Button>
          <Button
            onClick={handleSave}
            disabled={busy || (newPassword.length > 0 && newPassword.length < 6)}
            data-testid="button-save-edit-user"
          >
            {busy ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const [role, setRole] = useState<EditableRole>("sanggar");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [noHp, setNoHp] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setRole("sanggar");
      setUsername("");
      setPassword("");
      setNama("");
      setEmail("");
      setNoHp("");
    }
  }, [open]);

  const handleCreate = async () => {
    if (!username.trim() || password.length < 6 || !nama.trim()) {
      toast({ title: "Lengkapi data", description: "Username, sandi (>=6 huruf), dan nama wajib diisi.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      // Coba buat di server agar bisa login.
      let apiId: string | null = null;
      let serverUnavailable = false;
      try {
        const created = await usersApi.create({
          username: username.trim(),
          password,
          role,
          status: "aktif",
          profile: { nama },
        });
        apiId = created.id;
      } catch (err) {
        if (err instanceof ApiError) {
          // Logical error (validation/conflict/forbidden) — jangan diam-diam buat lokal,
          // agar tidak ada akun "hantu" yang tidak bisa login.
          toast({
            title: "Gagal buat akun",
            description: err.message,
            variant: "destructive",
          });
          setBusy(false);
          return;
        }
        // Network / server tak terjangkau → lanjut buat lokal sebagai fallback.
        serverUnavailable = true;
        toast({
          title: "Server tidak terjangkau",
          description: "Akun dibuat lokal dahulu — sinkronkan saat server tersedia.",
          variant: "destructive",
        });
      }
      const baseId = apiId ? `u_api_${apiId}` : uid();
      void serverUnavailable;
      save((db) => {
        const now = Date.now();
        const baseFields = {
          id: baseId,
          username: username.trim(),
          password,
          email: email.trim() || undefined,
          noHp: noHp.trim() || undefined,
          createdAt: now,
        };
        let newUser: AnyUser;
        if (role === "sanggar") {
          newUser = {
            ...baseFields,
            role: "sanggar",
            namaSanggar: nama.trim(),
            namaKetua: nama.trim(),
            legalitas: "Non-Badan Hukum",
            jenisKesenian: ["Tari"],
            alamat: "",
            rekening: { bank: "BCA", nomor: "", atasNama: nama.trim() },
            saldo: 0,
            editCount: 0,
            editPeriodStart: now,
          } as SanggarUser;
        } else if (role === "pelatih") {
          newUser = {
            ...baseFields,
            role: "pelatih",
            nama: nama.trim(),
            usia: 0,
            pendidikan: "",
            jenisKesenian: "Tari",
            status: "aktif",
            rekening: { bank: "BCA", nomor: "", atasNama: nama.trim() },
            honorPerSesi: 0,
          } as PelatihUser;
        } else if (role === "seniman") {
          newUser = {
            ...baseFields,
            role: "seniman",
            nama: nama.trim(),
            usia: 0,
            pendidikan: "",
            jenisKesenian: "Tari",
            status: "aktif",
            rekening: { bank: "BCA", nomor: "", atasNama: nama.trim() },
          } as SenimanUser;
        } else if (role === "juri") {
          newUser = {
            ...baseFields,
            role: "juri",
            nama: nama.trim(),
            keahlian: "",
          } as JuriUser;
        } else {
          newUser = {
            ...baseFields,
            role: "admin",
            nama: nama.trim(),
            permissions: {
              kelolaBerita: true,
              kelolaBanner: true,
              kelolaSlider: true,
              kelolaJamPembinaan: true,
              kelolaInfoBudaya: true,
            },
          } as AdminUser;
        }
        db.users.push(newUser);
      });
      logActivity(baseId, role, "kurator-create-akun", { username: username.trim() });
      toast({ title: "Akun dibuat", description: `${ROLE_LABEL[role]} ${nama} berhasil dibuat.` });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Tambah Akun Baru</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Peran</Label>
            <Select value={role} onValueChange={(v) => setRole(v as EditableRole)}>
              <SelectTrigger data-testid="select-create-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sanggar">Sanggar</SelectItem>
                <SelectItem value="pelatih">Pelatih</SelectItem>
                <SelectItem value="seniman">Seniman</SelectItem>
                <SelectItem value="juri">Juri</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nama {role === "sanggar" ? "Sanggar" : "Lengkap"}</Label>
            <Input value={nama} onChange={(e) => setNama(e.target.value)} data-testid="input-create-nama" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" data-testid="input-create-username" />
            </div>
            <div>
              <Label>Sandi Awal</Label>
              <Input type="text" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="input-create-password" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email (opsional)</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>No HP (opsional)</Label>
              <Input value={noHp} onChange={(e) => setNoHp(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Batal</Button>
          <Button onClick={handleCreate} disabled={busy} data-testid="button-confirm-create-user">
            {busy ? "Membuat..." : "Buat Akun"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function KuratorAccounts() {
  const db = useDb();
  const { toast } = useToast();
  const { impersonate } = useAuth();
  const [, navigate] = useLocation();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | Role>("all");
  const [editing, setEditing] = useState<AnyUser | null>(null);
  const [creating, setCreating] = useState(false);
  const items = db.users
    .filter((u) => filter === "all" || u.role === filter)
    .filter((u) => {
      if (!q) return true;
      const name = getDisplayName(u).toLowerCase();
      return name.includes(q.toLowerCase()) || u.username.toLowerCase().includes(q.toLowerCase());
    });
  const hapus = (id: string) => {
    if (!confirm("Hapus akun ini? Tindakan ini tidak bisa dibatalkan.")) return;
    save((d) => {
      d.users = d.users.filter((u) => u.id !== id);
    });
    toast({ title: "Akun dihapus" });
  };
  const handleLoginAs = (target: AnyUser) => {
    if (target.role === "kurator") {
      toast({ title: "Tidak bisa login-as kurator lain", variant: "destructive" });
      return;
    }
    if (impersonate(target.id)) {
      toast({
        title: `Masuk sebagai ${getDisplayName(target)}`,
        description: `Peran: ${ROLE_LABEL[target.role]}. Pakai banner emas untuk kembali.`,
      });
      navigate(`/${target.role}`);
    } else {
      toast({ title: "Gagal login-as", variant: "destructive" });
    }
  };
  return (
    <div>
      <PageHeader
        title="Pengelolaan Akun"
        subtitle="Kurator: kelola seluruh akun (Sanggar, Pelatih, Seniman, Juri, Admin) — edit profil, reset sandi, login-as."
      />
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <Input
          placeholder="Cari nama / username..."
          className="max-w-xs"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          data-testid="input-search-akun"
        />
        <Select value={filter} onValueChange={(v) => setFilter(v as "all" | Role)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Peran</SelectItem>
            <SelectItem value="sanggar">Sanggar</SelectItem>
            <SelectItem value="pelatih">Pelatih</SelectItem>
            <SelectItem value="seniman">Seniman</SelectItem>
            <SelectItem value="juri">Juri</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="kurator">Kurator</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button onClick={() => setCreating(true)} className="gap-1" data-testid="button-tambah-akun">
          <Plus className="h-4 w-4" />Tambah Akun
        </Button>
      </div>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead>Daftar</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Tidak ada akun yang cocok.
                </TableCell>
              </TableRow>
            )}
            {items.map((u) => (
              <TableRow key={u.id} data-testid={`row-akun-${u.id}`}>
                <TableCell className="font-medium">{getDisplayName(u)}</TableCell>
                <TableCell><Badge variant="outline">{ROLE_LABEL[u.role]}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{u.username}</TableCell>
                <TableCell className="text-sm">{u.noHp ?? u.email ?? "-"}</TableCell>
                <TableCell className="text-sm">{fmtDate(u.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => setEditing(u)}
                      data-testid={`button-edit-${u.id}`}
                    >
                      <UserCog className="h-3.5 w-3.5" />Edit
                    </Button>
                    {u.role !== "kurator" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => handleLoginAs(u)}
                        data-testid={`button-loginas-${u.id}`}
                      >
                        <LogIn className="h-3.5 w-3.5" />Login As
                      </Button>
                    )}
                    {u.role !== "kurator" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => hapus(u.id)}
                        data-testid={`button-hapus-${u.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      {editing && (
        <EditUserDialog
          user={editing}
          open={!!editing}
          onOpenChange={(v) => { if (!v) setEditing(null); }}
        />
      )}
      <CreateUserDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}

export function KuratorMatriks() {
  const db = useDb();
  const { toast } = useToast();
  const [m, setM] = useState<Indikator[]>(db.kurasiMatrix.indikator);
  const totalBobot = m.reduce((s, i) => s + i.bobot, 0);
  const sumValid = (vs: Variabel[]) => vs.reduce((s, v) => s + v.bobot, 0) === 100;

  const simpan = () => {
    if (totalBobot !== 100) { toast({ title: "Bobot Indikator harus total 100%", variant: "destructive" }); return; }
    if (!m.every(i => i.variabel.length === 0 || sumValid(i.variabel))) { toast({ title: "Bobot Variabel pada tiap Indikator harus 100%", variant: "destructive" }); return; }
    save(d => { d.kurasiMatrix = { indikator: m, updatedAt: Date.now() }; });
    toast({ title: "Sistem kurasi disimpan" });
  };

  const downloadTemplate = () => {
    const csv = "Indikator,Bobot Indikator,Variabel,Bobot Variabel\nManajemen Organisasi,30,Legalitas,50\nManajemen Organisasi,30,Keuangan,50\nTampilan Karya,70,Kualitas Artistik,40\nTampilan Karya,70,Originalitas,30\nTampilan Karya,70,Kekompakan,30";
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "template-kurasi.csv"; a.click();
  };

  const handleInjek = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      const rows = text.split(/\r?\n/).slice(1).filter(Boolean).map(r => r.split(","));
      const grouped: Record<string, Indikator> = {};
      rows.forEach(([ind, bInd, varN, bVar]) => {
        if (!grouped[ind]) grouped[ind] = { id: uid(), nama: ind, bobot: Number(bInd), variabel: [] };
        grouped[ind].variabel.push({ id: uid(), nama: varN, bobot: Number(bVar), subVariabel: [] });
      });
      setM(Object.values(grouped));
      toast({ title: "Matriks dimuat dari file", description: `${rows.length} baris diproses.` });
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <PageHeader title="Setup Sistem Kurasi" subtitle="Bangun matriks Indikator → Variabel → Sub-variabel beserta bobotnya." actions={
        <>
          <Button variant="outline" className="gap-2" onClick={downloadTemplate}><FileDown className="h-4 w-4" />Unduh Template</Button>
          <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm cursor-pointer hover-elevate"><FileDown className="h-4 w-4" /> Injek File<input type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleInjek(e.target.files[0])} /></label>
          <Button onClick={simpan}>Simpan Matriks</Button>
        </>
      } />

      <Card className="p-3 mb-4 flex items-center justify-between text-sm"><div>Total Bobot Indikator</div><Badge variant={totalBobot === 100 ? "default" : "destructive"}>{totalBobot}%</Badge></Card>

      <div className="space-y-4">
        {m.map((ind, i) => (
          <Card key={ind.id} className="p-4">
            <div className="grid grid-cols-[1fr_120px_auto] gap-3 items-end">
              <div className="space-y-1.5"><Label>Nama Indikator</Label><Input value={ind.nama} onChange={e => setM(m.map((x, idx) => idx === i ? { ...x, nama: e.target.value } : x))} /></div>
              <div className="space-y-1.5"><Label>Bobot %</Label><Input type="number" value={ind.bobot} onChange={e => setM(m.map((x, idx) => idx === i ? { ...x, bobot: Number(e.target.value) } : x))} /></div>
              <Button size="icon" variant="outline" onClick={() => setM(m.filter((_, idx) => idx !== i))}><X className="h-4 w-4" /></Button>
            </div>
            <div className="mt-4 ml-4 border-l-2 border-primary/40 pl-4 space-y-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Variabel · Total {ind.variabel.reduce((s, v) => s + v.bobot, 0)}%</div>
              {ind.variabel.map((v, j) => (
                <div key={v.id} className="grid grid-cols-[1fr_100px_auto] gap-2 items-center">
                  <Input value={v.nama} onChange={e => setM(m.map((x, idx) => idx === i ? { ...x, variabel: x.variabel.map((y, jj) => jj === j ? { ...y, nama: e.target.value } : y) } : x))} />
                  <Input type="number" value={v.bobot} onChange={e => setM(m.map((x, idx) => idx === i ? { ...x, variabel: x.variabel.map((y, jj) => jj === j ? { ...y, bobot: Number(e.target.value) } : y) } : x))} />
                  <Button size="icon" variant="outline" onClick={() => setM(m.map((x, idx) => idx === i ? { ...x, variabel: x.variabel.filter((_, jj) => jj !== j) } : x))}><X className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setM(m.map((x, idx) => idx === i ? { ...x, variabel: [...x.variabel, { id: uid(), nama: "Variabel Baru", bobot: 0, subVariabel: [] }] } : x))}><Plus className="h-3.5 w-3.5" />Tambah Variabel</Button>
            </div>
          </Card>
        ))}
        <Button variant="outline" className="gap-2" onClick={() => setM([...m, { id: uid(), nama: "Indikator Baru", bobot: 0, variabel: [] }])}><Plus className="h-4 w-4" />Tambah Indikator</Button>
      </div>
    </div>
  );
}

export function KuratorAssign() {
  const db = useDb();
  const { toast } = useToast();
  const juris = db.users.filter(u => u.role === "juri") as JuriUser[];
  const sanggars = db.users.filter(u => u.role === "sanggar") as SanggarUser[];
  const [juri, setJuri] = useState(juris[0]?.id ?? "");
  const [sg, setSg] = useState(sanggars[0]?.id ?? "");
  const [periode, setPeriode] = useState("Kurasi 2026 Tahap I");

  const tugaskan = () => {
    if (!juri || !sg) return;
    save(d => { d.penugasanJuri.push({ id: uid(), juriId: juri, sanggarId: sg, periode, createdAt: Date.now() }); });
    toast({ title: "Penugasan tersimpan" });
  };

  return (
    <div>
      <PageHeader title="Penugasan Juri" subtitle="Tetapkan Juri ke Sanggar tertentu untuk periode kurasi." />
      <Card className="p-5 max-w-xl space-y-3 mb-6">
        <div className="space-y-1.5"><Label>Pilih Juri</Label>
          <Select value={juri} onValueChange={setJuri}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{juris.map(j => <SelectItem key={j.id} value={j.id}>{j.nama}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="space-y-1.5"><Label>Pilih Sanggar</Label>
          <Select value={sg} onValueChange={setSg}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{sanggars.map(s => <SelectItem key={s.id} value={s.id}>{s.namaSanggar}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="space-y-1.5"><Label>Periode</Label><Input value={periode} onChange={e => setPeriode(e.target.value)} /></div>
        <Button onClick={tugaskan}>Tugaskan</Button>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Juri</TableHead><TableHead>Sanggar</TableHead><TableHead>Periode</TableHead><TableHead>Dibuat</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {db.penugasanJuri.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Belum ada penugasan.</TableCell></TableRow>}
            {db.penugasanJuri.map(p => {
              const j = db.users.find(u => u.id === p.juriId);
              const s = db.users.find(u => u.id === p.sanggarId);
              return <TableRow key={p.id}><TableCell>{(j as any)?.nama}</TableCell><TableCell>{(s as any)?.namaSanggar}</TableCell><TableCell>{p.periode}</TableCell><TableCell>{fmtDate(p.createdAt)}</TableCell><TableCell><Button size="sm" variant="outline" onClick={() => save(d => { d.penugasanJuri = d.penugasanJuri.filter(x => x.id !== p.id); })}>Hapus</Button></TableCell></TableRow>;
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export function KuratorStaff() {
  const db = useDb();
  const { toast } = useToast();
  const admins = db.users.filter(u => u.role === "admin") as AdminUser[];
  const juris = db.users.filter(u => u.role === "juri") as JuriUser[];

  const tambahAdmin = (nama: string, username: string, password: string) => {
    save(d => { d.users.push({ id: uid(), role: "admin", username, password, nama, permissions: { kelolaBerita: true, kelolaBanner: true, kelolaSlider: true, kelolaJamPembinaan: false }, createdAt: Date.now() } as AdminUser); });
    toast({ title: "Admin ditambahkan" });
  };
  const tambahJuri = (nama: string, username: string, password: string, keahlian: string) => {
    save(d => { d.users.push({ id: uid(), role: "juri", username, password, nama, keahlian, createdAt: Date.now() } as JuriUser); });
    toast({ title: "Juri ditambahkan" });
  };
  const togglePerm = (id: string, key: keyof AdminPermissions, v: boolean) => save(d => { const a = d.users.find(u => u.id === id) as AdminUser | undefined; if (a) a.permissions[key] = v; });

  return (
    <div>
      <PageHeader title="Manajemen Admin & Juri" subtitle="Buat akun staff secara manual dan atur hak aksesnya." />
      <Tabs defaultValue="admin">
        <TabsList><TabsTrigger value="admin">Admin</TabsTrigger><TabsTrigger value="juri">Juri</TabsTrigger></TabsList>
        <TabsContent value="admin" className="space-y-4">
          <NewAccountForm onSubmit={tambahAdmin} kind="admin" />
          {admins.map(a => (
            <Card key={a.id} className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div><div className="font-medium">{a.nama}</div><div className="text-xs text-muted-foreground">@{a.username}</div></div>
                <Button size="sm" variant="destructive" onClick={() => save(d => { d.users = d.users.filter(u => u.id !== a.id); })}>Hapus</Button>
              </div>
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                {(Object.keys(a.permissions) as (keyof AdminPermissions)[]).map(k => (
                  <label key={k} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm"><span>{k}</span><Switch checked={a.permissions[k]} onCheckedChange={c => togglePerm(a.id, k, c)} /></label>
                ))}
              </div>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="juri" className="space-y-4">
          <NewAccountForm onSubmit={(n, u, p, extra) => tambahJuri(n, u, p, extra ?? "")} kind="juri" />
          {juris.map(j => (
            <Card key={j.id} className="p-5 flex items-center justify-between gap-4">
              <div><div className="font-medium">{j.nama}</div><div className="text-xs text-muted-foreground">@{j.username} · {j.keahlian}</div></div>
              <Button size="sm" variant="destructive" onClick={() => save(d => { d.users = d.users.filter(u => u.id !== j.id); })}>Hapus</Button>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NewAccountForm({ onSubmit, kind }: { onSubmit: (nama: string, username: string, password: string, extra?: string) => void; kind: "admin" | "juri" }) {
  const [f, setF] = useState({ nama: "", username: "", password: "", keahlian: "" });
  return (
    <Card className="p-5">
      <h3 className="font-serif text-lg flex items-center gap-2"><Shield className="h-5 w-5" />Buat Akun {kind === "admin" ? "Admin" : "Juri"}</h3>
      <div className="mt-3 grid sm:grid-cols-4 gap-3">
        <Input placeholder="Nama lengkap" value={f.nama} onChange={e => setF({ ...f, nama: e.target.value })} />
        <Input placeholder="Username" value={f.username} onChange={e => setF({ ...f, username: e.target.value })} />
        <Input placeholder="Password" type="password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
        {kind === "juri" ? <Input placeholder="Keahlian" value={f.keahlian} onChange={e => setF({ ...f, keahlian: e.target.value })} /> : <Button onClick={() => { if (f.nama && f.username && f.password) { onSubmit(f.nama, f.username, f.password); setF({ nama: "", username: "", password: "", keahlian: "" }); } }}>Buat</Button>}
        {kind === "juri" && <Button className="sm:col-span-4" onClick={() => { if (f.nama && f.username && f.password) { onSubmit(f.nama, f.username, f.password, f.keahlian); setF({ nama: "", username: "", password: "", keahlian: "" }); } }}>Buat Juri</Button>}
      </div>
    </Card>
  );
}

const SWATCHES: { name: string; primary: string; accent: string }[] = [
  { name: "Navy Emas (Default)", primary: "220 55% 18%", accent: "42 65% 53%" },
  { name: "Maroon Klasik", primary: "4 70% 38%", accent: "41 75% 50%" },
  { name: "Hijau Daun", primary: "145 50% 30%", accent: "41 75% 50%" },
  { name: "Biru Lautan", primary: "215 60% 35%", accent: "41 75% 55%" },
  { name: "Ungu Sastra", primary: "275 45% 38%", accent: "41 75% 55%" },
  { name: "Sepia Hangat", primary: "28 55% 32%", accent: "32 70% 58%" },
  { name: "Mocha Latte", primary: "20 35% 28%", accent: "30 60% 55%" },
  { name: "Pink Pastel", primary: "330 50% 45%", accent: "320 70% 70%" },
  { name: "Hutan Tropis", primary: "150 45% 22%", accent: "85 65% 50%" },
  { name: "Senja Karang", primary: "12 60% 32%", accent: "20 80% 60%" },
];

type ThemePresetDef = {
  id: string;
  name: string;
  desc: string;
  mode: "light" | "dark" | "luxury";
  primary: string;
  accent: string;
  preview: string;
};

const THEMES: ThemePresetDef[] = [
  { id: "light", name: "Terang", desc: "Cream + navy + emas. Cocok pemakaian siang & cetak.", mode: "light", primary: "220 55% 18%", accent: "42 65% 53%", preview: "linear-gradient(135deg, hsl(38 35% 96%) 0%, hsl(220 30% 90%) 100%)" },
  { id: "dark", name: "Gelap", desc: "Navy gelap + emas hangat. Nyaman di mata.", mode: "dark", primary: "220 55% 18%", accent: "42 65% 53%", preview: "linear-gradient(135deg, hsl(222 38% 10%) 0%, hsl(222 50% 18%) 100%)" },
  { id: "luxury", name: "Dark Luxury", desc: "Navy pekat + glow emas premium.", mode: "luxury", primary: "42 78% 60%", accent: "42 80% 62%", preview: "linear-gradient(135deg, hsl(224 60% 5%) 0%, hsl(268 40% 14%) 60%, hsl(42 55% 25%) 100%)" },
  { id: "sepia", name: "Sepia Klasik", desc: "Aksen kayu manis & cream — terasa hangat & vintage.", mode: "light", primary: "28 55% 32%", accent: "32 70% 58%", preview: "linear-gradient(135deg, hsl(36 60% 92%) 0%, hsl(28 55% 78%) 100%)" },
  { id: "ocean", name: "Lautan Biru", desc: "Biru laut dalam + cyan terang. Tegas dan modern.", mode: "dark", primary: "210 80% 22%", accent: "190 80% 55%", preview: "linear-gradient(135deg, hsl(210 70% 8%) 0%, hsl(200 60% 18%) 100%)" },
  { id: "hutan", name: "Hutan Tropis", desc: "Hijau lumut + lime. Segar dan natural.", mode: "dark", primary: "150 45% 22%", accent: "85 65% 50%", preview: "linear-gradient(135deg, hsl(150 50% 8%) 0%, hsl(145 45% 16%) 100%)" },
  { id: "senja", name: "Senja Maroon", desc: "Maroon dramatis + peach. Hangat dan elegan.", mode: "dark", primary: "350 55% 25%", accent: "20 80% 60%", preview: "linear-gradient(135deg, hsl(350 50% 8%) 0%, hsl(20 60% 22%) 100%)" },
  { id: "pastel", name: "Pastel Lembut", desc: "Pink & lavender lembut — friendly & ringan.", mode: "light", primary: "330 50% 45%", accent: "320 70% 70%", preview: "linear-gradient(135deg, hsl(330 60% 95%) 0%, hsl(280 50% 92%) 100%)" },
  { id: "mocha", name: "Mocha Latte", desc: "Cokelat susu + krim. Klasik dan elegan.", mode: "light", primary: "20 35% 28%", accent: "30 60% 55%", preview: "linear-gradient(135deg, hsl(35 40% 92%) 0%, hsl(25 30% 80%) 100%)" },
];

const KATEGORI_LIST: TradisiKategori[] = ["Pantun Betawi", "Peribahasa", "Palang Pintu", "Sahibul Hikayat", "Cerita Rakyat", "Salam Betawi", "Rancag", "Lenong"];

function readImageFile(file: File, maxBytes = 2_000_000): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) return reject(new Error(`Ukuran file melebihi ${Math.round(maxBytes / 1_000_000)} MB.`));
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error ?? new Error("Gagal membaca file"));
    r.readAsDataURL(file);
  });
}

// Read any image (no size cap on input) and auto-compress it to under
// `targetBytes` by scaling down to max dimension and stepping JPEG quality.
// Returns { dataUrl, width, height, finalBytes, originalBytes }.
async function compressImageFile(
  file: File,
  opts: { targetBytes?: number; maxDimension?: number } = {},
): Promise<{ dataUrl: string; width: number; height: number; finalBytes: number; originalBytes: number }> {
  const targetBytes = opts.targetBytes ?? 900_000; // ~0.9 MB after base64 inflation stays well under 2 MB
  const maxDimension = opts.maxDimension ?? 1920;
  if (!file.type.startsWith("image/")) throw new Error("File bukan gambar.");

  const originalDataUrl: string = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error ?? new Error("Gagal membaca file"));
    r.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("Gambar tidak bisa dimuat."));
    im.src = originalDataUrl;
  });

  let { width, height } = { width: img.naturalWidth, height: img.naturalHeight };
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  let curW = Math.max(1, Math.round(width * scale));
  let curH = Math.max(1, Math.round(height * scale));

  const tryEncode = (w: number, h: number, q: number): string => {
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas tidak tersedia.");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", q);
  };

  const dataUrlBytes = (s: string) => Math.ceil((s.length - s.indexOf(",") - 1) * 3 / 4);

  let dataUrl = tryEncode(curW, curH, 0.88);
  let finalBytes = dataUrlBytes(dataUrl);
  const qualitySteps = [0.78, 0.68, 0.58, 0.48, 0.4, 0.33];
  for (const q of qualitySteps) {
    if (finalBytes <= targetBytes) break;
    dataUrl = tryEncode(curW, curH, q);
    finalBytes = dataUrlBytes(dataUrl);
  }
  // If still too large, progressively shrink dimensions
  let safety = 0;
  while (finalBytes > targetBytes && Math.max(curW, curH) > 480 && safety++ < 6) {
    curW = Math.round(curW * 0.8);
    curH = Math.round(curH * 0.8);
    dataUrl = tryEncode(curW, curH, 0.7);
    finalBytes = dataUrlBytes(dataUrl);
    if (finalBytes > targetBytes) {
      dataUrl = tryEncode(curW, curH, 0.5);
      finalBytes = dataUrlBytes(dataUrl);
    }
  }

  return { dataUrl, width: curW, height: curH, finalBytes, originalBytes: file.size };
}

export function KuratorAppearance() {
  const db = useDb();
  const { toast } = useToast();
  const ap = db.appearance;
  const t = useT();
  const currentPreset = ap.themePreset ?? ap.theme ?? "light";

  const applyMode = (mode: "light" | "dark" | "luxury") => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode !== "light");
    root.classList.toggle("luxury", mode === "luxury");
  };

  const apply = (primary: string, accent: string) => {
    save(d => { d.appearance.primaryHsl = primary; d.appearance.accentHsl = accent; if (d.appearance.customTheme) d.appearance.customTheme.enabled = false; });
    document.documentElement.style.setProperty("--primary", primary);
    document.documentElement.style.setProperty("--accent", accent);
    toast({ title: t("Tema diperbarui") });
  };

  const setPreset = (preset: ThemePresetDef) => {
    save(d => {
      d.appearance.theme = preset.mode;
      d.appearance.themePreset = preset.id;
      d.appearance.dark = preset.mode !== "light";
      d.appearance.primaryHsl = preset.primary;
      d.appearance.accentHsl = preset.accent;
      if (d.appearance.customTheme) d.appearance.customTheme.enabled = false;
    });
    applyMode(preset.mode);
    document.documentElement.style.setProperty("--primary", preset.primary);
    document.documentElement.style.setProperty("--accent", preset.accent);
    toast({ title: `${t("Tema diperbarui")}: ${preset.name}` });
  };

  return (
    <div>
      <PageHeader title={t("Pengaturan Tampilan")} subtitle="Kustomisasi identitas brand, warna, latar belakang, bahasa, hingga isi & perilaku pop-up Tradisi Betawi." />

      <Tabs defaultValue="brand" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="brand" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" />{t("Brand & Logo")}</TabsTrigger>
          <TabsTrigger value="tema" className="gap-1.5"><Palette className="h-3.5 w-3.5" />{t("Tema & Warna")}</TabsTrigger>
          <TabsTrigger value="backdrop" className="gap-1.5"><ImageIcon className="h-3.5 w-3.5" />{t("Backdrop")}</TabsTrigger>
          <TabsTrigger value="tradisi" className="gap-1.5"><ScrollText className="h-3.5 w-3.5" />{t("Pop-up Tradisi")}</TabsTrigger>
          <TabsTrigger value="studio" className="gap-1.5" data-testid="tab-studio"><Wand2 className="h-3.5 w-3.5" />{t("Studio Lanjutan")}</TabsTrigger>
          <TabsTrigger value="bahasa" className="gap-1.5" data-testid="tab-bahasa"><Languages className="h-3.5 w-3.5" />{t("Bahasa")}</TabsTrigger>
        </TabsList>

        <TabsContent value="brand"><BrandTab /></TabsContent>

        <TabsContent value="tema">
          <Card className="p-5 mb-4">
            <h3 className="font-serif text-lg flex items-center gap-2"><Palette className="h-5 w-5" />{t("Mode Tampilan")}</h3>
            <p className="text-sm text-muted-foreground mt-1">Pilih atmosfer yang paling nyaman. Berlaku untuk semua pengguna.</p>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {THEMES.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p)}
                  className={`text-left rounded-2xl border p-3 transition-all ${
                    currentPreset === p.id
                      ? "border-accent ring-2 ring-accent/40"
                      : "border-border hover:border-accent/50 hover:-translate-y-0.5"
                  }`}
                  data-testid={`theme-${p.id}`}
                >
                  <div className="h-20 w-full rounded-xl mb-3 relative overflow-hidden" style={{ background: p.preview, border: "1px solid hsl(var(--border))" }}>
                    <div className="absolute inset-x-3 top-3 h-2 rounded-full" style={{ background: `hsl(${p.accent})` }} />
                    <div className="absolute left-3 right-1/2 bottom-3 h-1.5 rounded-full bg-white/40" />
                    <div className="absolute right-3 left-2/3 bottom-3 h-1.5 rounded-full bg-white/20" />
                  </div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{p.desc}</div>
                </button>
              ))}
            </div>
          </Card>

          <CustomThemeCard />

          <Card className="p-5 mt-4">
            <h3 className="font-serif text-lg flex items-center gap-2"><Palette className="h-5 w-5" />{t("Aksen Warna")}</h3>
            <p className="text-sm text-muted-foreground mt-1">Ganti hanya warna primer & aksen tanpa mengubah mode. Klik salah satu untuk menerapkan langsung.</p>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {SWATCHES.map(s => (
                <button key={s.name} onClick={() => apply(s.primary, s.accent)} className={`text-left rounded-xl border p-3 transition hover:-translate-y-0.5 ${ap.primaryHsl === s.primary ? "ring-2 ring-accent border-accent" : "hover:border-accent/40"}`}>
                  <div className="flex gap-1.5"><div className="h-9 flex-1 rounded-md" style={{ background: `hsl(${s.primary})` }} /><div className="h-9 flex-1 rounded-md" style={{ background: `hsl(${s.accent})` }} /></div>
                  <div className="text-sm mt-2 font-medium">{s.name}</div>
                </button>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="backdrop"><BackdropTab /></TabsContent>
        <TabsContent value="tradisi"><TradisiTab /></TabsContent>
        <TabsContent value="studio"><StudioTab /></TabsContent>
        <TabsContent value="bahasa"><BahasaTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function CustomThemeCard() {
  const db = useDb();
  const { toast } = useToast();
  const t = useT();
  const ct = db.appearance.customTheme ?? { enabled: false, mode: "light" as const, primaryHsl: "220 55% 18%", accentHsl: "42 65% 53%", bgOpacity: 0.22 };
  const [draft, setDraft] = useState(ct);
  const [busy, setBusy] = useState(false);

  const hslToHex = (hsl: string): string => {
    const m = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
    if (!m) return "#1f3a72";
    const h = +m[1], s = +m[2] / 100, l = +m[3] / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const mm = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else[r, g, b] = [c, 0, x];
    const toHex = (n: number) => Math.round((n + mm) * 255).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };
  const hexToHsl = (hex: string): string => {
    const m = hex.replace("#", "").match(/^([0-9a-f]{6})$/i);
    if (!m) return draft.primaryHsl;
    const r = parseInt(m[1].slice(0, 2), 16) / 255;
    const g = parseInt(m[1].slice(2, 4), 16) / 255;
    const b = parseInt(m[1].slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
        case g: h = ((b - r) / d + 2); break;
        case b: h = ((r - g) / d + 4); break;
      }
      h *= 60;
    }
    return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const onUpload = async (file: File) => {
    try {
      setBusy(true);
      const r = await compressImageFile(file, { targetBytes: 900_000, maxDimension: 1920 });
      setDraft(d => ({ ...d, bgImageDataUrl: r.dataUrl }));
      toast({ title: "Gambar tema siap. Tekan Simpan untuk menerapkan." });
    } catch (e: any) {
      toast({ title: "Gagal memuat gambar", description: e?.message ?? "", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const simpan = () => {
    try {
      save(d => {
        const ap = d.appearance;
        const wasEnabled = ap.customTheme?.enabled ?? false;
        const baseline = wasEnabled
          ? ap.customTheme?.previousBaseline
          : {
              theme: (ap.theme ?? "light") as ThemeMode,
              themePreset: ap.themePreset ?? ap.theme ?? "light",
              primaryHsl: ap.primaryHsl,
              accentHsl: ap.accentHsl,
              dark: ap.dark,
            };
        ap.customTheme = { ...draft, enabled: true, previousBaseline: baseline };
        ap.theme = draft.mode;
        ap.themePreset = "custom";
        ap.dark = draft.mode !== "light";
        ap.primaryHsl = draft.primaryHsl;
        ap.accentHsl = draft.accentHsl;
      });
      const root = document.documentElement;
      root.classList.toggle("dark", draft.mode !== "light");
      root.classList.toggle("luxury", draft.mode === "luxury");
      root.style.setProperty("--primary", draft.primaryHsl);
      root.style.setProperty("--accent", draft.accentHsl);
      toast({ title: t("Tema kustom diterapkan") });
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e?.message ?? "", variant: "destructive" });
    }
  };

  const matikan = () => {
    try {
      const restoredBox: Array<{ mode: ThemeMode; primary: string; accent: string }> = [];
      save(d => {
        const ap = d.appearance;
        const baseline = ap.customTheme?.previousBaseline;
        if (baseline) {
          ap.theme = baseline.theme;
          ap.themePreset = baseline.themePreset;
          ap.primaryHsl = baseline.primaryHsl;
          ap.accentHsl = baseline.accentHsl;
          ap.dark = baseline.dark;
          restoredBox.push({ mode: baseline.theme, primary: baseline.primaryHsl, accent: baseline.accentHsl });
        }
        if (ap.customTheme) {
          ap.customTheme.enabled = false;
          ap.customTheme.previousBaseline = undefined;
        }
      });
      setDraft(d => ({ ...d, enabled: false }));
      const restored = restoredBox[0];
      if (restored) {
        const root = document.documentElement;
        root.classList.toggle("dark", restored.mode !== "light");
        root.classList.toggle("luxury", restored.mode === "luxury");
        root.style.setProperty("--primary", restored.primary);
        root.style.setProperty("--accent", restored.accent);
      }
      toast({ title: "Tema kustom dimatikan" });
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e?.message ?? "", variant: "destructive" });
    }
  };

  return (
    <Card className="p-5 mt-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-serif text-lg flex items-center gap-2"><Sparkles className="h-5 w-5" />{t("Tema Kustom Anda")}</h3>
          <p className="text-sm text-muted-foreground mt-1">Pilih warna primer + aksen sendiri, ditambah opsi gambar latar tema. Sistem akan otomatis mengecilkan gambar.</p>
        </div>
        {ct.enabled && (
          <div className="text-[11px] uppercase tracking-wider px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">Aktif</div>
        )}
      </div>

      <div className="mt-4 grid lg:grid-cols-[1fr_280px] gap-4">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Mode Dasar</Label>
              <Select value={draft.mode} onValueChange={(v: any) => setDraft({ ...draft, mode: v })}>
                <SelectTrigger data-testid="select-custom-mode"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Terang</SelectItem>
                  <SelectItem value="dark">Gelap</SelectItem>
                  <SelectItem value="luxury">Dark Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Warna Primer</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={hslToHex(draft.primaryHsl)} onChange={e => setDraft({ ...draft, primaryHsl: hexToHsl(e.target.value) })} className="h-9 w-12 rounded cursor-pointer" data-testid="color-custom-primary" />
                <Input value={draft.primaryHsl} onChange={e => setDraft({ ...draft, primaryHsl: e.target.value })} className="font-mono text-xs" placeholder="220 55% 18%" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Warna Aksen</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={hslToHex(draft.accentHsl)} onChange={e => setDraft({ ...draft, accentHsl: hexToHsl(e.target.value) })} className="h-9 w-12 rounded cursor-pointer" data-testid="color-custom-accent" />
                <Input value={draft.accentHsl} onChange={e => setDraft({ ...draft, accentHsl: e.target.value })} className="font-mono text-xs" placeholder="42 65% 53%" />
              </div>
            </div>
          </div>

          <div>
            <Label>Gambar Latar Tema (opsional)</Label>
            <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">Berlaku saat tema kustom aktif. Akan ditampilkan di seluruh halaman setelah login.</p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="h-20 w-32 rounded-md border bg-muted/30 grid place-items-center overflow-hidden">
                {draft.bgImageDataUrl ? <img src={draft.bgImageDataUrl} alt="bg" className="h-full w-full object-cover" /> : <span className="text-[11px] text-muted-foreground">Tanpa gambar</span>}
              </div>
              <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm cursor-pointer hover-elevate">
                <Upload className="h-4 w-4" />{busy ? "Memproses..." : (draft.bgImageDataUrl ? "Ganti Gambar" : "Unggah Gambar")}
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} data-testid="input-custom-bg" />
              </label>
              {draft.bgImageDataUrl && <Button size="sm" variant="outline" onClick={() => setDraft(d => ({ ...d, bgImageDataUrl: undefined }))} className="gap-1"><X className="h-3.5 w-3.5" />Hapus</Button>}
            </div>
            {draft.bgImageDataUrl && (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between"><Label>Opasitas Gambar</Label><span className="text-xs text-muted-foreground tabular-nums">{Math.round((draft.bgOpacity ?? 0.22) * 100)}%</span></div>
                <input type="range" min={5} max={80} value={Math.round((draft.bgOpacity ?? 0.22) * 100)} onChange={e => setDraft({ ...draft, bgOpacity: Number(e.target.value) / 100 })} className="w-full" />
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={simpan} className="gap-1.5" data-testid="button-save-custom-theme"><Sparkles className="h-4 w-4" />{t("Simpan Tema Kustom")}</Button>
            {ct.enabled && <Button variant="outline" onClick={matikan} className="gap-1.5"><X className="h-4 w-4" />Matikan</Button>}
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden h-fit" style={{ background: draft.bgImageDataUrl ? `url(${draft.bgImageDataUrl}) center/cover` : `hsl(${draft.primaryHsl})` }}>
          <div className="p-4" style={{ background: draft.bgImageDataUrl ? `hsl(${draft.primaryHsl} / ${1 - (draft.bgOpacity ?? 0.22)})` : "transparent", minHeight: 180 }}>
            <div className="text-[10px] uppercase tracking-widest text-white/70 mb-2">Pratinjau</div>
            <div className="font-serif text-xl text-white">Halo, ini tema kustom</div>
            <div className="mt-3 inline-block px-3 py-1.5 rounded-md text-xs font-medium" style={{ background: `hsl(${draft.accentHsl})`, color: "hsl(220 60% 10%)" }}>Tombol Aksen</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

const SERIF_FONTS = [
  { id: "Playfair Display", label: "Playfair Display" },
  { id: "DM Serif Display", label: "DM Serif Display" },
  { id: "Lora", label: "Lora" },
  { id: "Cormorant Garamond", label: "Cormorant Garamond" },
  { id: "Merriweather", label: "Merriweather" },
];
const SANS_FONTS = [
  { id: "Inter", label: "Inter" },
  { id: "Manrope", label: "Manrope" },
  { id: "Plus Jakarta Sans", label: "Plus Jakarta Sans" },
  { id: "Poppins", label: "Poppins" },
];

function _hslToHex(hsl?: string, fallback = "#1f3a72"): string {
  if (!hsl) return fallback;
  const m = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!m) return fallback;
  const h = +m[1], s = +m[2] / 100, l = +m[3] / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const mm = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else[r, g, b] = [c, 0, x];
  const toHex = (n: number) => Math.round((n + mm) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function _hexToHsl(hex: string, fallback = "220 50% 20%"): string {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6})$/i);
  if (!m) return fallback;
  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function ColorRow({ label, hsl, onChange, fallbackHex, testid }: { label: string; hsl?: string; onChange: (v: string) => void; fallbackHex: string; testid?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-sm flex-1">{label}</div>
      <input
        type="color"
        value={_hslToHex(hsl, fallbackHex)}
        onChange={e => onChange(_hexToHsl(e.target.value))}
        className="h-9 w-12 rounded cursor-pointer border border-border"
        data-testid={testid}
      />
      {hsl && (
        <button
          type="button"
          className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => onChange("")}
          data-testid={testid ? `${testid}-reset` : undefined}
        >
          reset
        </button>
      )}
    </div>
  );
}

function StudioTab() {
  const db = useDb();
  const { toast } = useToast();
  const t = useT();
  const initial: StudioSettings = db.appearance.studio ?? { fontScale: 1, sidebarImageOpacity: 0.18, loginHeroOverlayOpacity: 0.55 };
  const [draft, setDraft] = useState<StudioSettings>(initial);
  const [busy, setBusy] = useState(false);

  const set = (patch: Partial<StudioSettings>) => setDraft(d => ({ ...d, ...patch }));

  const onUploadSidebar = async (file: File) => {
    try {
      setBusy(true);
      const r = await compressImageFile(file, { targetBytes: 800_000, maxDimension: 1600 });
      set({ sidebarImageDataUrl: r.dataUrl });
      toast({ title: t("Gambar siap. Tekan Simpan untuk menerapkan.") });
    } catch (e: any) {
      toast({ title: t("Gagal memuat gambar"), description: e?.message ?? "", variant: "destructive" });
    } finally { setBusy(false); }
  };
  const onUploadHero = async (file: File) => {
    try {
      setBusy(true);
      const r = await compressImageFile(file, { targetBytes: 1_000_000, maxDimension: 1920 });
      set({ loginHeroImageDataUrl: r.dataUrl });
      toast({ title: t("Gambar siap. Tekan Simpan untuk menerapkan.") });
    } catch (e: any) {
      toast({ title: t("Gagal memuat gambar"), description: e?.message ?? "", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const simpan = () => {
    try {
      save(d => { d.appearance.studio = { ...(d.appearance.studio ?? {}), ...draft }; });
      toast({ title: t("Studio diperbarui") });
    } catch (e: any) {
      toast({ title: t("Gagal menyimpan"), description: e?.message ?? "", variant: "destructive" });
    }
  };
  const resetSemua = () => {
    const fresh: StudioSettings = { fontScale: 1, sidebarImageOpacity: 0.18, loginHeroOverlayOpacity: 0.55 };
    setDraft(fresh);
    save(d => { d.appearance.studio = fresh; });
    toast({ title: t("Studio dikembalikan ke bawaan") });
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-serif text-lg flex items-center gap-2"><Type className="h-5 w-5" />{t("Tipografi")}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t("Pilih jenis huruf untuk judul dan teks isi, serta atur skala teks global.")}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">{t("Font Judul")}</Label>
            <Select value={draft.fontSerif ?? "__default"} onValueChange={(v) => set({ fontSerif: v === "__default" ? undefined : v })}>
              <SelectTrigger className="mt-2" data-testid="select-font-serif"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__default">{t("Bawaan")} (Playfair Display)</SelectItem>
                {SERIF_FONTS.map(f => <SelectItem key={f.id} value={f.id} style={{ fontFamily: `'${f.id}', serif` }}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="mt-3 p-3 rounded border border-border bg-muted/40 text-2xl" style={{ fontFamily: draft.fontSerif ? `'${draft.fontSerif}', serif` : undefined }}>Aa Bb 123</div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">{t("Font Isi")}</Label>
            <Select value={draft.fontSans ?? "__default"} onValueChange={(v) => set({ fontSans: v === "__default" ? undefined : v })}>
              <SelectTrigger className="mt-2" data-testid="select-font-sans"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__default">{t("Bawaan")} (Inter)</SelectItem>
                {SANS_FONTS.map(f => <SelectItem key={f.id} value={f.id} style={{ fontFamily: `'${f.id}', sans-serif` }}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="mt-3 p-3 rounded border border-border bg-muted/40 text-base" style={{ fontFamily: draft.fontSans ? `'${draft.fontSans}', sans-serif` : undefined }}>Aa Bb 123 — kalimat contoh.</div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">{t("Skala Teks")} ({Math.round((draft.fontScale ?? 1) * 100)}%)</Label>
            <input
              type="range" min={0.85} max={1.2} step={0.05}
              value={draft.fontScale ?? 1}
              onChange={e => set({ fontScale: parseFloat(e.target.value) })}
              className="w-full mt-3"
              data-testid="range-font-scale"
            />
            <div className="text-xs text-muted-foreground mt-2">{t("Berlaku ke seluruh aplikasi.")}</div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-serif text-lg flex items-center gap-2"><LayoutTemplate className="h-5 w-5" />{t("Permukaan & Sudut")}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t("Atur warna halaman, kartu, garis batas, serta tingkat kelengkungan sudut.")}</p>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <ColorRow label={t("Warna Halaman")} hsl={draft.backgroundHsl} onChange={(v) => set({ backgroundHsl: v || undefined })} fallbackHex="#f4eee2" testid="color-bg" />
          <ColorRow label={t("Warna Teks")} hsl={draft.foregroundHsl} onChange={(v) => set({ foregroundHsl: v || undefined })} fallbackHex="#0f1a33" testid="color-fg" />
          <ColorRow label={t("Warna Kartu")} hsl={draft.cardHsl} onChange={(v) => set({ cardHsl: v || undefined })} fallbackHex="#ffffff" testid="color-card" />
          <ColorRow label={t("Warna Garis")} hsl={draft.borderHsl} onChange={(v) => set({ borderHsl: v || undefined })} fallbackHex="#d6cdb8" testid="color-border" />
          <div className="sm:col-span-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">{t("Sudut")} ({(draft.borderRadius ?? 0.625).toFixed(3)} rem)</Label>
            <input type="range" min={0} max={1.5} step={0.125}
              value={draft.borderRadius ?? 0.625}
              onChange={e => set({ borderRadius: parseFloat(e.target.value) })}
              className="w-full mt-2" data-testid="range-radius" />
            <div className="mt-3 flex gap-3">
              <div className="h-12 w-24 bg-primary text-primary-foreground grid place-items-center text-xs" style={{ borderRadius: `${draft.borderRadius ?? 0.625}rem` }}>Tombol</div>
              <div className="h-12 w-24 bg-card border border-border grid place-items-center text-xs" style={{ borderRadius: `${draft.borderRadius ?? 0.625}rem` }}>Kartu</div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-serif text-lg flex items-center gap-2"><Wand2 className="h-5 w-5" />{t("Sidebar")}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t("Ganti warna, atau unggah gambar latar untuk sidebar navigasi.")}</p>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <ColorRow label={t("Warna Sidebar")} hsl={draft.sidebarHsl} onChange={(v) => set({ sidebarHsl: v || undefined })} fallbackHex="#0f1a33" testid="color-sidebar" />
          <ColorRow label={t("Warna Teks Sidebar")} hsl={draft.sidebarFgHsl} onChange={(v) => set({ sidebarFgHsl: v || undefined })} fallbackHex="#f4eee2" testid="color-sidebar-fg" />
          <div className="sm:col-span-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">{t("Gambar Latar Sidebar")}</Label>
            <div className="flex items-center gap-3 mt-2">
              <label className="inline-flex items-center gap-2 px-3 h-9 rounded border border-border cursor-pointer bg-muted/40 hover:bg-muted text-sm">
                <Upload className="h-4 w-4" /> {t("Unggah")}
                <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => e.target.files?.[0] && onUploadSidebar(e.target.files[0])} data-testid="file-sidebar-bg" />
              </label>
              {draft.sidebarImageDataUrl && (
                <button type="button" className="text-xs text-muted-foreground underline-offset-2 hover:underline inline-flex items-center gap-1" onClick={() => set({ sidebarImageDataUrl: undefined })}>
                  <Trash2 className="h-3.5 w-3.5" /> {t("Hapus")}
                </button>
              )}
              {draft.sidebarImageDataUrl && <img src={draft.sidebarImageDataUrl} alt="" className="h-9 w-14 object-cover rounded border border-border" />}
            </div>
            <div className="mt-3">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">{t("Opasitas Gambar")} ({Math.round((draft.sidebarImageOpacity ?? 0.18) * 100)}%)</Label>
              <input type="range" min={0} max={1} step={0.05}
                value={draft.sidebarImageOpacity ?? 0.18}
                onChange={e => set({ sidebarImageOpacity: parseFloat(e.target.value) })}
                className="w-full mt-2" data-testid="range-sidebar-opacity" />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-serif text-lg flex items-center gap-2"><LogIn className="h-5 w-5" />{t("Halaman Masuk")}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t("Ganti gambar dan warna lapisan panel kiri halaman masuk.")}</p>
        <div className="mt-4 space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">{t("Gambar Hero")}</Label>
            <div className="flex items-center gap-3 mt-2">
              <label className="inline-flex items-center gap-2 px-3 h-9 rounded border border-border cursor-pointer bg-muted/40 hover:bg-muted text-sm">
                <Upload className="h-4 w-4" /> {t("Unggah")}
                <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => e.target.files?.[0] && onUploadHero(e.target.files[0])} data-testid="file-login-hero" />
              </label>
              {draft.loginHeroImageDataUrl && (
                <button type="button" className="text-xs text-muted-foreground underline-offset-2 hover:underline inline-flex items-center gap-1" onClick={() => set({ loginHeroImageDataUrl: undefined })}>
                  <Trash2 className="h-3.5 w-3.5" /> {t("Hapus")}
                </button>
              )}
              {draft.loginHeroImageDataUrl && <img src={draft.loginHeroImageDataUrl} alt="" className="h-9 w-14 object-cover rounded border border-border" />}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <ColorRow label={t("Warna Lapisan")} hsl={draft.loginHeroOverlayHsl} onChange={(v) => set({ loginHeroOverlayHsl: v || undefined })} fallbackHex="#0f1a33" testid="color-login-overlay" />
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">{t("Opasitas Lapisan")} ({Math.round((draft.loginHeroOverlayOpacity ?? 0.55) * 100)}%)</Label>
              <input type="range" min={0} max={1} step={0.05}
                value={draft.loginHeroOverlayOpacity ?? 0.55}
                onChange={e => set({ loginHeroOverlayOpacity: parseFloat(e.target.value) })}
                className="w-full mt-2" data-testid="range-login-overlay-opacity" />
            </div>
          </div>
        </div>
      </Card>

      <div className="sticky bottom-3 z-10 flex justify-between gap-2 pt-2">
        <Button variant="outline" onClick={resetSemua} className="gap-2" data-testid="btn-studio-reset">
          <RotateCcw className="h-4 w-4" /> {t("Kembalikan Bawaan")}
        </Button>
        <Button onClick={simpan} className="gap-2" data-testid="btn-studio-simpan">
          <Check className="h-4 w-4" /> {t("Simpan Studio")}
        </Button>
      </div>
    </div>
  );
}

function BahasaTab() {
  const db = useDb();
  const { toast } = useToast();
  const t = useT();
  const cur = db.appearance.language ?? "id";
  const [lang, setLang] = useState<"id" | "btw">(cur);

  const simpan = () => {
    save(d => { d.appearance.language = lang; });
    toast({ title: t("Bahasa berhasil diganti") });
  };

  return (
    <Card className="p-5 max-w-2xl">
      <h3 className="font-serif text-lg flex items-center gap-2"><Languages className="h-5 w-5" />{t("Pilih Bahasa Antarmuka")}</h3>
      <p className="text-sm text-muted-foreground mt-1">Pilihan bahasa hanya tersedia untuk Bahasa Indonesia (resmi) dan Bahasa Betawi (logat khas Jakarta — santai & ramah).</p>

      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        {[
          { id: "id" as const, label: t("Bahasa Indonesia"), desc: "Bahasa resmi nasional. Cocok untuk dokumen, pelaporan, dan kebutuhan formal." },
          { id: "btw" as const, label: t("Bahasa Betawi"), desc: "Logat khas warga asli Jakarta. Ramah, hangat, dan bercita rasa lokal." },
        ].map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setLang(opt.id)}
            className={`text-left rounded-2xl border p-4 transition-all ${lang === opt.id ? "border-accent ring-2 ring-accent/40 bg-accent/5" : "border-border hover:border-accent/50 hover:-translate-y-0.5"}`}
            data-testid={`bahasa-${opt.id}`}
          >
            <div className="flex items-center justify-between">
              <div className="font-serif text-lg">{opt.label}</div>
              {lang === opt.id && <Check className="h-4 w-4 text-accent" />}
            </div>
            <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">{opt.desc}</p>
          </button>
        ))}
      </div>

      <div className="mt-5 flex gap-2">
        <Button onClick={simpan} className="gap-1.5" data-testid="button-save-bahasa"><Sparkles className="h-4 w-4" />{t("Simpan Bahasa")}</Button>
      </div>

      <div className="mt-5 p-3 border rounded-lg bg-muted/40 text-[12px] text-muted-foreground">
        <strong>Catatan:</strong> Pilihan bahasa berlaku untuk halaman login, navigasi sidebar, label peran, dan tombol-tombol utama. Sebagian besar konten editorial (nama dokumen, nama acara, dll.) tetap mengikuti aslinya.
      </div>
    </Card>
  );
}

function BrandTab() {
  const db = useDb();
  const { toast } = useToast();
  const b = db.appearance.brand ?? { appName: "Jak Sanggar", appTagline: "", sidebarFooterLine1: "", sidebarFooterLine2: "", iconKey: "Sparkles" };
  const [draft, setDraft] = useState(b);
  const [busy, setBusy] = useState(false);

  const onUpload = async (file: File) => {
    try {
      setBusy(true);
      const url = await readImageFile(file, 1_500_000);
      setDraft(d => ({ ...d, logoDataUrl: url }));
      toast({ title: "Logo siap. Tekan Simpan untuk menerapkan." });
    } catch (e: any) {
      toast({ title: "Gagal memuat gambar", description: e?.message ?? "", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const removeLogo = () => setDraft(d => ({ ...d, logoDataUrl: undefined }));

  const simpan = () => {
    if (!draft.appName.trim()) { toast({ title: "Nama aplikasi wajib diisi", variant: "destructive" }); return; }
    try {
      save(d => { d.appearance.brand = { ...draft, appName: draft.appName.trim() }; });
      toast({ title: "Identitas brand disimpan" });
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e?.message ?? "", variant: "destructive" });
    }
  };

  const reset = () => {
    if (!confirm("Kembalikan semua identitas brand ke default Jak Sanggar?")) return;
    const def = {
      appName: "Jak Sanggar",
      appTagline: "Budaya Naik Kelas, Digital Tanpa Batas",
      sidebarFooterLine1: "Budaya Naik Kelas,",
      sidebarFooterLine2: "Digital Tanpa Batas",
      iconKey: "Sparkles",
      loginEyebrow: "Konsorsium Sanggar Betawi",
    };
    try {
      save(d => { d.appearance.brand = def; });
      setDraft(def);
      toast({ title: "Brand dikembalikan ke default" });
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e?.message ?? "", variant: "destructive" });
    }
  };

  const PreviewIcon = getBrandIcon(draft.iconKey);

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4">
      <div className="space-y-4">
        <Card className="p-5 space-y-4">
          <h3 className="font-serif text-lg flex items-center gap-2"><Type className="h-5 w-5" />Teks Identitas</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Nama Aplikasi</Label><Input value={draft.appName} onChange={e => setDraft({ ...draft, appName: e.target.value })} data-testid="input-brand-name" /></div>
            <div className="space-y-1.5"><Label>Eyebrow Login</Label><Input value={draft.loginEyebrow ?? ""} onChange={e => setDraft({ ...draft, loginEyebrow: e.target.value })} placeholder="mis. Konsorsium Sanggar Betawi" /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Tagline Utama (ditampilkan di halaman login & header)</Label>
            <Textarea rows={2} value={draft.appTagline} onChange={e => setDraft({ ...draft, appTagline: e.target.value })} placeholder="Budaya Naik Kelas, Digital Tanpa Batas" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Footer Sidebar — Baris 1</Label><Input value={draft.sidebarFooterLine1} onChange={e => setDraft({ ...draft, sidebarFooterLine1: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Footer Sidebar — Baris 2</Label><Input value={draft.sidebarFooterLine2} onChange={e => setDraft({ ...draft, sidebarFooterLine2: e.target.value })} /></div>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-serif text-lg flex items-center gap-2"><Sparkles className="h-5 w-5" />Ikon Brand</h3>
          <p className="text-xs text-muted-foreground">Pilih satu ikon untuk identitas. Jika logo diunggah, logo otomatis menggantikan ikon.</p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {BRAND_ICON_KEYS.map(({ key, label }) => {
              const Ico = getBrandIcon(key);
              const active = draft.iconKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDraft({ ...draft, iconKey: key })}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 transition ${active ? "border-accent ring-2 ring-accent/40 bg-accent/10" : "border-border hover:border-accent/50"}`}
                  title={label}
                  data-testid={`icon-${key}`}
                >
                  <Ico className="h-5 w-5" />
                  <span className="text-[9.5px] leading-tight text-muted-foreground">{label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-serif text-lg flex items-center gap-2"><Upload className="h-5 w-5" />Logo (PNG/JPG, maks 1.5 MB)</h3>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-16 w-16 rounded-lg border bg-muted/30 grid place-items-center overflow-hidden">
              {draft.logoDataUrl ? <img src={draft.logoDataUrl} alt="logo" className="h-full w-full object-cover" /> : <PreviewIcon className="h-7 w-7 text-muted-foreground" />}
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm cursor-pointer hover-elevate">
              <Upload className="h-4 w-4" />{busy ? "Memproses..." : (draft.logoDataUrl ? "Ganti Logo" : "Unggah Logo")}
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} />
            </label>
            {draft.logoDataUrl && <Button variant="outline" size="sm" onClick={removeLogo} className="gap-1"><X className="h-3.5 w-3.5" />Hapus Logo</Button>}
          </div>
        </Card>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={simpan} className="gap-1.5" data-testid="button-save-brand"><Sparkles className="h-4 w-4" />Simpan Identitas</Button>
          <Button variant="outline" onClick={reset} className="gap-1.5"><RotateCcw className="h-4 w-4" />Kembalikan Default</Button>
        </div>
      </div>

      <Card className="p-4 h-fit lg:sticky lg:top-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Pratinjau</div>
        <div className="rounded-xl p-4 text-amber-50" style={{ background: "linear-gradient(135deg, hsl(222 60% 8%) 0%, hsl(268 40% 18%) 100%)" }}>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-lg overflow-hidden grid place-items-center" style={{ background: "linear-gradient(135deg, hsl(42 80% 60%), hsl(38 65% 42%))" }}>
              {draft.logoDataUrl ? <img src={draft.logoDataUrl} alt="" className="h-full w-full object-cover" /> : <PreviewIcon className="h-5 w-5" style={{ color: "hsl(222 60% 10%)" }} />}
            </div>
            <div className="min-w-0">
              <div className="font-serif text-base truncate">{draft.appName || "—"}</div>
              <div className="text-[9px] uppercase tracking-[0.22em] text-amber-100/55 truncate">{draft.loginEyebrow || "—"}</div>
            </div>
          </div>
          <div className="mt-3 text-[12px] italic text-amber-100/80 leading-snug min-h-[36px]">"{draft.appTagline || "—"}"</div>
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="text-[9px] uppercase tracking-widest text-amber-100/45">{draft.sidebarFooterLine1 || "—"}</div>
            <div className="text-[9px] uppercase tracking-widest text-amber-100/45">{draft.sidebarFooterLine2 || "—"}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function BackdropTab() {
  const db = useDb();
  const { toast } = useToast();
  const bd = db.appearance.backdrop ?? { enabled: false, opacity: 0.18, blendMode: "soft-light" as const };
  const [draft, setDraft] = useState(bd);
  const [busy, setBusy] = useState(false);

  const fmtKB = (b: number) => b >= 1_000_000 ? `${(b / 1_000_000).toFixed(2)} MB` : `${Math.round(b / 1024)} KB`;

  const onUpload = async (file: File) => {
    try {
      setBusy(true);
      const r = await compressImageFile(file, { targetBytes: 900_000, maxDimension: 1920 });
      setDraft(d => ({ ...d, imageDataUrl: r.dataUrl, enabled: true }));
      const ratio = r.originalBytes > 0 ? Math.round((r.finalBytes / r.originalBytes) * 100) : 100;
      toast({
        title: "Backdrop siap dipakai",
        description: `Gambar dikecilkan otomatis: ${fmtKB(r.originalBytes)} → ${fmtKB(r.finalBytes)} (${ratio}%) pada ${r.width}×${r.height}px. Tekan Simpan untuk menerapkan.`,
      });
    } catch (e: any) {
      toast({ title: "Gagal memuat gambar", description: e?.message ?? "", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const simpan = () => {
    try {
      save(d => { d.appearance.backdrop = draft; });
      toast({ title: "Backdrop disimpan" });
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e?.message ?? "Gambar terlalu besar untuk penyimpanan lokal.", variant: "destructive" });
    }
  };

  const reset = () => {
    if (!confirm("Hapus backdrop & kembalikan ke default?")) return;
    const def = { enabled: false, opacity: 0.18, blendMode: "soft-light" as const, imageDataUrl: undefined };
    try {
      save(d => { d.appearance.backdrop = def; });
      setDraft(def);
      toast({ title: "Backdrop dihapus" });
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e?.message ?? "", variant: "destructive" });
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4">
      <Card className="p-5 space-y-4">
        <h3 className="font-serif text-lg flex items-center gap-2"><ImageIcon className="h-5 w-5" />Gambar Latar Belakang</h3>
        <p className="text-sm text-muted-foreground">Unggah gambar apa pun (PNG/JPG/WebP) — sistem akan otomatis mengecilkan & mengoptimasi (resize ≤ 1920px, kompresi JPEG) supaya hemat penyimpanan tanpa Anda repot. Ideal: 1920×1080 atau lebih.</p>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="h-20 w-32 rounded-md border bg-muted/30 grid place-items-center overflow-hidden">
            {draft.imageDataUrl ? <img src={draft.imageDataUrl} alt="backdrop" className="h-full w-full object-cover" /> : <span className="text-[11px] text-muted-foreground">Belum ada</span>}
          </div>
          <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm cursor-pointer hover-elevate">
            <Upload className="h-4 w-4" />{busy ? "Memproses..." : (draft.imageDataUrl ? "Ganti Gambar" : "Unggah Gambar")}
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} />
          </label>
          {draft.imageDataUrl && <Button size="sm" variant="outline" onClick={() => setDraft(d => ({ ...d, imageDataUrl: undefined, enabled: false }))} className="gap-1"><X className="h-3.5 w-3.5" />Hapus</Button>}
        </div>

        <label className="flex items-center justify-between border rounded-md px-3 py-2.5 text-sm">
          <div>
            <div className="font-medium">Aktifkan Backdrop</div>
            <div className="text-[11px] text-muted-foreground">Hanya berlaku jika gambar sudah diunggah.</div>
          </div>
          <Switch checked={!!draft.enabled} disabled={!draft.imageDataUrl} onCheckedChange={c => setDraft({ ...draft, enabled: c })} data-testid="switch-backdrop" />
        </label>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Opasitas</Label>
            <span className="text-xs text-muted-foreground tabular-nums">{Math.round((draft.opacity ?? 0.18) * 100)}%</span>
          </div>
          <input type="range" min={0} max={100} value={Math.round((draft.opacity ?? 0.18) * 100)} onChange={e => setDraft({ ...draft, opacity: Number(e.target.value) / 100 })} className="w-full" />
        </div>

        <div className="space-y-1.5">
          <Label>Mode Pencampuran</Label>
          <Select value={draft.blendMode ?? "soft-light"} onValueChange={(v: any) => setDraft({ ...draft, blendMode: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="soft-light">Soft Light (lembut)</SelectItem>
              <SelectItem value="overlay">Overlay (dramatis)</SelectItem>
              <SelectItem value="multiply">Multiply (gelap)</SelectItem>
              <SelectItem value="screen">Screen (terang)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={simpan} className="gap-1.5"><Sparkles className="h-4 w-4" />Simpan Backdrop</Button>
          <Button variant="outline" onClick={reset} className="gap-1.5"><RotateCcw className="h-4 w-4" />Reset</Button>
        </div>
      </Card>

      <Card className="p-4 h-fit lg:sticky lg:top-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Pratinjau Halaman</div>
        <div className="relative rounded-xl overflow-hidden border h-56 bg-background">
          {draft.imageDataUrl && draft.enabled && (
            <div className="absolute inset-0" style={{ backgroundImage: `url(${draft.imageDataUrl})`, backgroundSize: "cover", backgroundPosition: "center", opacity: draft.opacity ?? 0.18, mixBlendMode: (draft.blendMode ?? "soft-light") as any }} />
          )}
          <div className="relative p-3 space-y-2">
            <div className="h-3 w-32 rounded bg-foreground/20" />
            <div className="h-2 w-48 rounded bg-foreground/10" />
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[0, 1, 2].map(i => <div key={i} className="h-12 rounded-md border bg-card/70 backdrop-blur-sm" />)}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function TradisiTab() {
  const db = useDb();
  const { toast } = useToast();
  const t = db.appearance.tradisi ?? { enabled: true, position: "br" as const, cooldownMs: 2200, autoHideMs: 4200, cardWidth: 280, showCloseButton: true, source: "default" as const, custom: [] as TradisiItem[], kategoriColors: {} };
  const [draft, setDraft] = useState(t);

  const dirty = JSON.stringify(draft) !== JSON.stringify(t);

  const simpanSemua = () => {
    try {
      save(d => { d.appearance.tradisi = { ...draft }; });
      toast({ title: "Pengaturan tradisi disimpan" });
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e?.message ?? "", variant: "destructive" });
    }
  };
  const batalkan = () => { setDraft(t); toast({ title: "Perubahan dibatalkan" }); };

  const setKategoriColor = (k: TradisiKategori, color: string) => {
    setDraft(d => ({ ...d, kategoriColors: { ...d.kategoriColors, [k]: color } }));
  };
  const resetWarna = () => {
    setDraft(d => ({ ...d, kategoriColors: { ...DEFAULT_KATEGORI_COLOR } }));
  };

  const addItem = () => {
    const next: TradisiItem = { id: uid(), kategori: "Pantun Betawi", judul: "Judul Baru", isi: "Tulis isi pantun di sini...", sumber: "" };
    setDraft(d => ({ ...d, custom: [next, ...d.custom] }));
  };
  const updateItem = (id: string, patch: Partial<TradisiItem>) => {
    setDraft(d => ({ ...d, custom: d.custom.map(x => x.id === id ? { ...x, ...patch } : x) }));
  };
  const removeItem = (id: string) => {
    if (!confirm("Hapus pantun ini? (Belum tersimpan permanen sampai Anda menekan Simpan)")) return;
    setDraft(d => ({ ...d, custom: d.custom.filter(x => x.id !== id) }));
  };
  const importDefault = () => {
    if (!confirm(`Salin ${DEFAULT_TRADISI_POOL.length} pantun bawaan ke daftar custom (untuk diedit)?`)) return;
    const copied: TradisiItem[] = DEFAULT_TRADISI_POOL.map(x => ({ ...x, id: uid() }));
    setDraft(d => ({ ...d, custom: [...copied, ...d.custom] }));
  };

  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-4">
        <h3 className="font-serif text-lg flex items-center gap-2"><ScrollText className="h-5 w-5" />Perilaku Pop-up</h3>

        <label className="flex items-center justify-between border rounded-md px-3 py-2.5 text-sm">
          <div>
            <div className="font-medium">Aktifkan Pop-up Tradisi Betawi</div>
            <div className="text-[11px] text-muted-foreground">Muncul ketika pengguna mengklik tombol/tautan apa pun.</div>
          </div>
          <Switch checked={!!draft.enabled} onCheckedChange={c => setDraft({ ...draft, enabled: c })} data-testid="switch-tradisi-enabled" />
        </label>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Posisi Pop-up</Label>
            <Select value={draft.position} onValueChange={(v: any) => setDraft({ ...draft, position: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="br">Kanan Bawah</SelectItem>
                <SelectItem value="bl">Kiri Bawah</SelectItem>
                <SelectItem value="tr">Kanan Atas</SelectItem>
                <SelectItem value="tl">Kiri Atas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Sumber Pantun</Label>
            <Select value={draft.source} onValueChange={(v: any) => setDraft({ ...draft, source: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Bawaan (28 pantun)</SelectItem>
                <SelectItem value="custom">Hanya Custom</SelectItem>
                <SelectItem value="merge">Bawaan + Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Jeda Antar Pop-up (ms)</Label>
            <Input type="number" min={500} max={20000} step={100} value={draft.cooldownMs} onChange={e => setDraft({ ...draft, cooldownMs: Number(e.target.value) || 2200 })} />
          </div>
          <div className="space-y-1.5">
            <Label>Durasi Tampil (ms)</Label>
            <Input type="number" min={1000} max={30000} step={100} value={draft.autoHideMs} onChange={e => setDraft({ ...draft, autoHideMs: Number(e.target.value) || 4200 })} />
          </div>
          <div className="space-y-1.5">
            <Label>Lebar Kartu (px)</Label>
            <Input type="number" min={220} max={420} step={10} value={draft.cardWidth} onChange={e => setDraft({ ...draft, cardWidth: Number(e.target.value) || 280 })} />
          </div>
        </div>

        <label className="flex items-center justify-between border rounded-md px-3 py-2.5 text-sm">
          <div>
            <div className="font-medium">Tampilkan Tombol Tutup (×)</div>
            <div className="text-[11px] text-muted-foreground">Muncul saat pop-up dihover.</div>
          </div>
          <Switch checked={!!draft.showCloseButton} onCheckedChange={c => setDraft({ ...draft, showCloseButton: c })} />
        </label>

      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-serif text-lg flex items-center gap-2"><Palette className="h-5 w-5" />Warna per Kategori</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Tentukan warna aksen untuk setiap kategori pantun.</p>
          </div>
          <Button size="sm" variant="outline" onClick={resetWarna} className="gap-1"><RotateCcw className="h-3.5 w-3.5" />Reset Warna</Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {KATEGORI_LIST.map(k => {
            const c = draft.kategoriColors?.[k] ?? DEFAULT_KATEGORI_COLOR[k];
            return (
              <div key={k} className="border rounded-lg p-3 space-y-2">
                <div className="text-xs font-medium">{k}</div>
                <div className="flex items-center gap-2">
                  <input type="color" value={c} onChange={e => setKategoriColor(k, e.target.value)} className="h-9 w-12 rounded cursor-pointer" />
                  <Input value={c} onChange={e => setKategoriColor(k, e.target.value)} className="font-mono text-xs" />
                </div>
                <div className="rounded-md px-2 py-1 text-[10px] uppercase tracking-wider inline-block" style={{ background: `${c}1f`, color: c, border: `1px solid ${c}55` }}>contoh</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-serif text-lg flex items-center gap-2"><ScrollText className="h-5 w-5" />Daftar Pantun Custom ({draft.custom.length})</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Kelola isi tradisi lisan. Aktif sesuai pilihan "Sumber Pantun" di atas.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={importDefault} className="gap-1"><FileDown className="h-3.5 w-3.5" />Salin Bawaan</Button>
            <Button size="sm" onClick={addItem} className="gap-1" data-testid="button-add-pantun"><Plus className="h-3.5 w-3.5" />Tambah</Button>
          </div>
        </div>

        {draft.custom.length === 0 && (
          <div className="text-center py-10 text-sm text-muted-foreground border border-dashed rounded-lg">
            Belum ada pantun custom. Klik "Tambah" atau "Salin Bawaan" untuk memulai.
          </div>
        )}

        <div className="space-y-3">
          {draft.custom.map(item => (
            <div key={item.id} className="border rounded-lg p-3 space-y-2">
              <div className="grid sm:grid-cols-[180px_1fr_auto] gap-2 items-start">
                <Select value={item.kategori} onValueChange={(v: any) => updateItem(item.id, { kategori: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{KATEGORI_LIST.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                </Select>
                <Input value={item.judul} onChange={e => updateItem(item.id, { judul: e.target.value })} placeholder="Judul" />
                <Button size="icon" variant="outline" onClick={() => removeItem(item.id)} title="Hapus"><Trash2 className="h-4 w-4" /></Button>
              </div>
              <Textarea rows={3} value={item.isi} onChange={e => updateItem(item.id, { isi: e.target.value })} placeholder="Isi pantun (gunakan Enter untuk baris baru)" className="font-serif" />
              <Input value={item.sumber ?? ""} onChange={e => updateItem(item.id, { sumber: e.target.value })} placeholder="Sumber (opsional)" />
            </div>
          ))}
        </div>
      </Card>

      <div className="sticky bottom-2 z-10 flex items-center justify-between gap-3 rounded-xl border bg-card/95 backdrop-blur px-4 py-3 shadow-lg">
        <div className="text-xs text-muted-foreground">
          {dirty ? <span className="text-amber-600 dark:text-amber-400">● Ada perubahan belum tersimpan</span> : <span>Semua tersimpan</span>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={batalkan} disabled={!dirty} className="gap-1.5"><RotateCcw className="h-3.5 w-3.5" />Batalkan</Button>
          <Button onClick={simpanSemua} disabled={!dirty} className="gap-1.5" data-testid="button-save-tradisi"><Sparkles className="h-4 w-4" />Simpan Semua</Button>
        </div>
      </div>
    </div>
  );
}

export function KuratorWaktu() {
  const db = useDb();
  const { toast } = useToast();
  const [j, setJ] = useState(db.jamPembinaan);
  const [pwd, setPwd] = useState(db.exportPassword);
  return (
    <div>
      <PageHeader title="Pengaturan Jam Pembinaan & Sistem" subtitle="Atur batas waktu absensi dan password unduhan." />
      <Card className="p-5 max-w-2xl space-y-4">
        <h3 className="font-serif text-lg flex items-center gap-2"><Clock className="h-5 w-5" />Window Absensi</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field l="Pagi (maks)" v={j.pagiMax} on={v => setJ({ ...j, pagiMax: v })} />
          <Field l="Siang Mulai" v={j.siangStart} on={v => setJ({ ...j, siangStart: v })} />
          <Field l="Siang Selesai" v={j.siangEnd} on={v => setJ({ ...j, siangEnd: v })} />
          <Field l="Pulang Mulai" v={j.pulangStart} on={v => setJ({ ...j, pulangStart: v })} />
          <Field l="Pulang Selesai" v={j.pulangEnd} on={v => setJ({ ...j, pulangEnd: v })} />
        </div>
        <div className="space-y-1.5">
          <Label>Password Edit PDF (digunakan oleh seluruh Sanggar)</Label>
          <Input type="text" value={pwd} onChange={e => setPwd(e.target.value)} />
          <p className="text-[11px] text-muted-foreground">Minimal 6 karakter. PDF yang diekspor dapat dibuka langsung tanpa password; password ini hanya diperlukan ketika seseorang ingin mengedit isi PDF tersebut.</p>
        </div>
        <Button onClick={() => {
          if (pwd.trim().length < 6) {
            toast({ title: "Password edit terlalu pendek", description: "Gunakan minimal 6 karakter agar perlindungan edit PDF efektif.", variant: "destructive" });
            return;
          }
          save(d => { d.jamPembinaan = j; d.exportPassword = pwd.trim(); });
          toast({ title: "Pengaturan disimpan" });
        }}>Simpan</Button>
      </Card>
    </div>
  );
}
function Field({ l, v, on }: { l: string; v: string; on: (s: string) => void }) {
  return <div className="space-y-1.5"><Label>{l}</Label><Input type="time" value={v} onChange={e => on(e.target.value)} /></div>;
}
