import { useState } from "react";
import { useAuth, useDb } from "@/lib/auth";
import { save, uid, fmtDate, logActivity } from "@/lib/store";
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
import type { AdminUser, JuriUser, SanggarUser, PelatihUser, SenimanUser, Indikator, Variabel, AdminPermissions } from "@/lib/types";
import { Trash2, Eye, FileDown, Plus, Palette, Clock, Shield, X, Crown, Users, GraduationCap, UserCog, Wallet } from "lucide-react";
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

export function KuratorAccounts() {
  const db = useDb();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "sanggar" | "pelatih" | "seniman">("all");
  const items = db.users.filter(u => ["sanggar", "pelatih", "seniman"].includes(u.role))
    .filter(u => filter === "all" || u.role === filter)
    .filter(u => !q || ((u as any).nama || (u as any).namaSanggar || u.username).toLowerCase().includes(q.toLowerCase()));
  const hapus = (id: string) => {
    if (!confirm("Hapus akun ini?")) return;
    save(d => { d.users = d.users.filter(u => u.id !== id); });
    toast({ title: "Akun dihapus" });
  };
  return (
    <div>
      <PageHeader title="Pengelolaan Akun" subtitle="Pantau seluruh akun publik (Sanggar, Pelatih, Seniman)." />
      <div className="flex gap-2 mb-4 flex-wrap">
        <Input placeholder="Cari nama / username..." className="max-w-xs" value={q} onChange={e => setQ(e.target.value)} />
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Semua</SelectItem><SelectItem value="sanggar">Sanggar</SelectItem><SelectItem value="pelatih">Pelatih</SelectItem><SelectItem value="seniman">Seniman</SelectItem></SelectContent>
        </Select>
      </div>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Peran</TableHead><TableHead>Username</TableHead><TableHead>Kontak</TableHead><TableHead>Daftar</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Tidak ada akun yang cocok.</TableCell></TableRow>}
            {items.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{(u as any).namaSanggar || (u as any).nama}</TableCell>
                <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{u.username}</TableCell>
                <TableCell className="text-sm">{u.noHp ?? u.email ?? "-"}</TableCell>
                <TableCell className="text-sm">{fmtDate(u.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild><Button size="sm" variant="outline" className="gap-1 mr-2"><Eye className="h-3.5 w-3.5" />Lihat</Button></DialogTrigger>
                    <DialogContent><DialogHeader><DialogTitle>{(u as any).namaSanggar || (u as any).nama}</DialogTitle></DialogHeader>
                      <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-96">{JSON.stringify({ ...u, password: "***" }, null, 2)}</pre>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" variant="destructive" onClick={() => hapus(u.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
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
];

const THEMES: { id: "light" | "dark" | "luxury"; name: string; desc: string; preview: string }[] = [
  { id: "light", name: "Terang", desc: "Cream + navy + emas. Cocok pemakaian siang & cetak.", preview: "linear-gradient(135deg, hsl(38 35% 96%) 0%, hsl(220 30% 90%) 100%)" },
  { id: "dark", name: "Gelap", desc: "Navy gelap + emas hangat. Nyaman di mata.", preview: "linear-gradient(135deg, hsl(222 38% 10%) 0%, hsl(222 50% 18%) 100%)" },
  { id: "luxury", name: "Dark Luxury", desc: "Navy paling pekat + glow emas premium.", preview: "linear-gradient(135deg, hsl(224 60% 5%) 0%, hsl(268 40% 14%) 60%, hsl(42 55% 25%) 100%)" },
];

export function KuratorAppearance() {
  const db = useDb();
  const { toast } = useToast();
  const ap = db.appearance;
  const currentTheme = ap.theme ?? (ap.dark ? "dark" : "light");
  const apply = (primary: string, accent: string) => {
    save(d => { d.appearance.primaryHsl = primary; d.appearance.accentHsl = accent; });
    document.documentElement.style.setProperty("--primary", primary);
    document.documentElement.style.setProperty("--accent", accent);
    toast({ title: "Skema warna diperbarui" });
  };
  const setTheme = (t: "light" | "dark" | "luxury") => {
    save(d => { d.appearance.theme = t; d.appearance.dark = t !== "light"; });
    const root = document.documentElement;
    root.classList.toggle("dark", t !== "light");
    root.classList.toggle("luxury", t === "luxury");
    toast({ title: `Tema: ${t === "light" ? "Terang" : t === "dark" ? "Gelap" : "Dark Luxury"}` });
  };
  return (
    <div>
      <PageHeader title="Pengaturan Tampilan" subtitle="Kustomisasi tema warna dan mode aplikasi." />

      <Card className="p-5 mb-6">
        <h3 className="font-serif text-lg flex items-center gap-2"><Palette className="h-5 w-5" />Mode Tampilan</h3>
        <p className="text-sm text-muted-foreground mt-1">Pilih atmosfer yang paling nyaman. Berlaku untuk semua pengguna.</p>
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`text-left rounded-2xl border p-3 transition-all ${
                currentTheme === t.id
                  ? "border-accent ring-2 ring-accent/40"
                  : "border-border hover:border-accent/50 hover:-translate-y-0.5"
              }`}
            >
              <div
                className="h-20 w-full rounded-xl mb-3 relative overflow-hidden"
                style={{ background: t.preview, border: "1px solid hsl(var(--border))" }}
              >
                <div className="absolute inset-x-3 top-3 h-2 rounded-full" style={{ background: "hsl(42 75% 60%)" }} />
                <div className="absolute left-3 right-1/2 bottom-3 h-1.5 rounded-full bg-white/40" />
                <div className="absolute right-3 left-2/3 bottom-3 h-1.5 rounded-full bg-white/20" />
              </div>
              <div className="text-sm font-medium">{t.name}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{t.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-serif text-lg flex items-center gap-2"><Palette className="h-5 w-5" />Aksen Warna</h3>
        <p className="text-sm text-muted-foreground mt-1">Atur warna primer & aksen secara opsional. Gunakan default <b>Navy Emas</b> untuk identitas Jak Sanggar.</p>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SWATCHES.map(s => (
            <button key={s.name} onClick={() => apply(s.primary, s.accent)} className={`text-left rounded-xl border p-3 transition hover:-translate-y-0.5 ${ap.primaryHsl === s.primary ? "ring-2 ring-accent border-accent" : "hover:border-accent/40"}`}>
              <div className="flex gap-1.5"><div className="h-9 flex-1 rounded-md" style={{ background: `hsl(${s.primary})` }} /><div className="h-9 flex-1 rounded-md" style={{ background: `hsl(${s.accent})` }} /></div>
              <div className="text-sm mt-2 font-medium">{s.name}</div>
            </button>
          ))}
        </div>
      </Card>
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
          <Label>Password Unduhan PDF (digunakan oleh seluruh Sanggar)</Label>
          <Input type="text" value={pwd} onChange={e => setPwd(e.target.value)} />
          <p className="text-[11px] text-muted-foreground">Minimal 6 karakter. Password ini mengunci file PDF yang diunduh dari modul Regenerasi.</p>
        </div>
        <Button onClick={() => {
          if (pwd.trim().length < 6) {
            toast({ title: "Password unduhan terlalu pendek", description: "Gunakan minimal 6 karakter agar PDF terkunci dengan baik.", variant: "destructive" });
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
