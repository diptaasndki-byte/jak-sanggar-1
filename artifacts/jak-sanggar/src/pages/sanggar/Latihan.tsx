import { useMemo, useState, useRef, useEffect } from "react";
import { useAuth, useDb } from "@/lib/auth";
import { save, uid, logActivity, fmtDateTime } from "@/lib/store";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { SanggarUser, PelatihUser, Latihan } from "@/lib/types";
import { Camera, MapPin, FileDown, Plus, Pencil, ShieldCheck, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { openPrintWindow, safeHtml, rawHtml } from "@/lib/print";

type Period = "hari" | "minggu" | "bulan" | "tahun";

function startOfDay(d: Date): Date { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function fmtYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function parseYmd(s: string): Date { const [y, m, d] = s.split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1); }

function getRange(period: Period, anchor: Date): { from: Date; to: Date; label: string } {
  const a = startOfDay(anchor);
  if (period === "hari") {
    return { from: a, to: addDays(a, 1), label: a.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) };
  }
  if (period === "minggu") {
    const dow = (a.getDay() + 6) % 7;
    const from = addDays(a, -dow);
    const to = addDays(from, 7);
    const last = addDays(to, -1);
    const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    const yearLabel = from.getFullYear() === last.getFullYear() ? String(from.getFullYear()) : `${from.getFullYear()}/${last.getFullYear()}`;
    return { from, to, label: `${fmt(from)} – ${fmt(last)} ${yearLabel}` };
  }
  if (period === "bulan") {
    const from = new Date(a.getFullYear(), a.getMonth(), 1);
    const to = new Date(a.getFullYear(), a.getMonth() + 1, 1);
    return { from, to, label: from.toLocaleDateString("id-ID", { month: "long", year: "numeric" }) };
  }
  const from = new Date(a.getFullYear(), 0, 1);
  const to = new Date(a.getFullYear() + 1, 0, 1);
  return { from, to, label: String(from.getFullYear()) };
}

function shiftAnchor(period: Period, anchor: Date, dir: -1 | 1): Date {
  const a = new Date(anchor);
  if (period === "hari") a.setDate(a.getDate() + dir);
  else if (period === "minggu") a.setDate(a.getDate() + 7 * dir);
  else if (period === "bulan") a.setMonth(a.getMonth() + dir);
  else a.setFullYear(a.getFullYear() + dir);
  return a;
}

export default function LatihanPage() {
  const { user } = useAuth();
  const db = useDb();
  const { toast } = useToast();
  const [period, setPeriod] = useState<Period>("bulan");
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));

  if (!user || user.role !== "sanggar") return null;
  const sg = user as SanggarUser;

  const allItems = db.latihan.filter(l => l.sanggarId === sg.id).sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.jam.localeCompare(a.jam));
  const pelatihList = db.users.filter(u => u.role === "pelatih" && (u as any).sanggarId === sg.id && (u as any).status === "aktif") as PelatihUser[];

  const range = getRange(period, anchor);
  const items = allItems.filter(l => {
    const d = parseYmd(l.tanggal);
    return d >= range.from && d < range.to;
  });

  const hasEditedAll = allItems.some(l => !!l.editedAt);
  const hasEditedRange = items.some(l => !!l.editedAt);

  const recap = (() => {
    const total = items.length;
    const sudahLapor = items.filter(l => !!l.laporan).length;
    const menunggu = total - sudahLapor;
    const tingkatLapor = total > 0 ? Math.round((sudahLapor / total) * 100) : 0;
    const perPelatih = new Map<string, number>();
    const perKurikulum = new Map<string, number>();
    for (const l of items) {
      const pn = pelatihList.find(p => p.id === l.pelatihId)?.nama ?? "Belum ditugaskan";
      perPelatih.set(pn, (perPelatih.get(pn) ?? 0) + 1);
      perKurikulum.set(l.kurikulum, (perKurikulum.get(l.kurikulum) ?? 0) + 1);
    }
    const topPelatih = [...perPelatih.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    const topKurikulum = [...perKurikulum.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    return { total, sudahLapor, menunggu, tingkatLapor, topPelatih, topKurikulum };
  })();

  const exportPdf = () => {
    if (hasEditedRange) {
      const pwd = prompt(`Jadwal pada periode ini sudah pernah diedit. Masukkan password Kurator untuk mengunduh PDF:`);
      if (pwd !== db.exportPassword) { toast({ title: "Password salah", variant: "destructive" }); return; }
    }
    const rows = items
      .map(l => {
        const editedMark = l.editedAt ? safeHtml` <span style="color:#b3651e;font-size:10px;font-style:italic">(diedit)</span>` : safeHtml``;
        const status = l.laporan ? "Sudah Lapor" : "Menunggu";
        return safeHtml`<tr><td>${l.tanggal}</td><td>${l.jam}</td><td>${l.tempat}</td><td>${l.kurikulum}${rawHtml(String(editedMark))}</td><td>${pelatihList.find(p => p.id === l.pelatihId)?.nama ?? "-"}</td><td>${status}</td></tr>`;
      })
      .join("");
    const note = hasEditedRange
      ? safeHtml`<p style="color:#b3651e;font-size:12px;margin-top:8px"><i>Catatan: terdapat baris jadwal yang telah diedit setelah dibuat. Unduhan ini diproteksi password.</i></p>`
      : safeHtml``;
    const periodLabel = ({ hari: "Harian", minggu: "Mingguan", bulan: "Bulanan", tahun: "Tahunan" } as const)[period];
    const summary = safeHtml`<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;margin:12px 0;font-size:12px"><tr><td><b>Total Jadwal</b></td><td>${recap.total}</td><td style="padding-left:24px"><b>Sudah Lapor</b></td><td>${recap.sudahLapor}</td><td style="padding-left:24px"><b>Menunggu</b></td><td>${recap.menunggu}</td><td style="padding-left:24px"><b>Tingkat Lapor</b></td><td>${recap.tingkatLapor}%</td></tr></table>`;
    const body = safeHtml`<h1 style="margin:0">Rekap Jadwal Latihan ${periodLabel} — ${sg.namaSanggar}</h1><div style="color:#555;font-size:13px;margin-top:4px">Periode: ${range.label}</div>${rawHtml(String(summary))}${rawHtml(String(note))}<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;margin-top:8px;font-size:12px"><thead><tr><th>Tanggal</th><th>Jam</th><th>Tempat</th><th>Kurikulum</th><th>Pelatih</th><th>Status</th></tr></thead><tbody>${rawHtml(rows)}</tbody></table>`;
    openPrintWindow({ title: `Rekap Jadwal Latihan ${periodLabel} ${sg.namaSanggar}`, bodyHtml: body });
  };

  // Group items for visual rendering by sub-period when viewing month/year
  const grouped = useMemo<Array<{ key: string; label: string; items: Latihan[] }>>(() => {
    if (period === "hari" || period === "minggu") {
      const buckets = new Map<string, Latihan[]>();
      for (const l of items) {
        if (!buckets.has(l.tanggal)) buckets.set(l.tanggal, []);
        buckets.get(l.tanggal)!.push(l);
      }
      return [...buckets.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([k, v]) => ({ key: k, label: parseYmd(k).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" }), items: v }));
    }
    if (period === "bulan") {
      const buckets = new Map<string, Latihan[]>();
      for (const l of items) {
        const d = parseYmd(l.tanggal);
        const dow = (d.getDay() + 6) % 7;
        const wkStart = addDays(d, -dow);
        const k = fmtYmd(wkStart);
        if (!buckets.has(k)) buckets.set(k, []);
        buckets.get(k)!.push(l);
      }
      return [...buckets.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([k, v]) => {
          const f = parseYmd(k);
          const t = addDays(f, 6);
          const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
          return { key: k, label: `Minggu ${fmt(f)} – ${fmt(t)}`, items: v };
        });
    }
    const buckets = new Map<string, Latihan[]>();
    for (const l of items) {
      const k = l.tanggal.slice(0, 7);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k)!.push(l);
    }
    return [...buckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => {
        const [y, m] = k.split("-").map(Number);
        const label = new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
        return { key: k, label, items: v };
      });
  }, [items, period]);

  const goToday = () => setAnchor(startOfDay(new Date()));

  return (
    <div>
      <PageHeader title="Jadwal Latihan" subtitle="Atur jadwal latihan, lapor kehadiran dengan kamera & GPS." actions={
        <>
          <Button variant="outline" className="gap-2" onClick={exportPdf}>
            {hasEditedRange ? <ShieldCheck className="h-4 w-4" /> : <FileDown className="h-4 w-4" />}
            Unduh Rekap
          </Button>
          <LatihanFormDialog sg={sg} pelatihList={pelatihList} />
        </>
      } />

      {hasEditedAll && !hasEditedRange && (
        <div className="mb-3 text-xs text-muted-foreground">
          Catatan: ada jadwal yang sudah diedit di periode lain — unduh PDF di periode itu akan diproteksi password.
        </div>
      )}
      {hasEditedRange && (
        <div className="mb-4 text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-md px-3 py-2 inline-flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5" />
          Ada jadwal yang sudah diedit di periode ini — unduh rekap kini diproteksi password Kurator.
        </div>
      )}

      <Card className="p-4 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList>
              <TabsTrigger value="hari">Hari</TabsTrigger>
              <TabsTrigger value="minggu">Minggu</TabsTrigger>
              <TabsTrigger value="bulan">Bulan</TabsTrigger>
              <TabsTrigger value="tahun">Tahun</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setAnchor(shiftAnchor(period, anchor, -1))} aria-label="Periode sebelumnya">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-3 h-8 inline-flex items-center gap-2 text-sm font-medium border rounded-md bg-background min-w-[180px] justify-center">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              {range.label}
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setAnchor(shiftAnchor(period, anchor, 1))} aria-label="Periode berikutnya">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={goToday}>Hari Ini</Button>
            <Input type="date" value={fmtYmd(anchor)} onChange={(e) => setAnchor(parseYmd(e.target.value))} className="h-8 w-[150px]" />
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-3 mt-4">
          <RecapStat label="Total Jadwal" value={recap.total} />
          <RecapStat label="Sudah Lapor" value={recap.sudahLapor} accent="emerald" />
          <RecapStat label="Menunggu" value={recap.menunggu} accent="amber" />
          <RecapStat label="Tingkat Lapor" value={`${recap.tingkatLapor}%`} accent="primary" />
        </div>

        {(recap.topPelatih.length > 0 || recap.topKurikulum.length > 0) && (
          <div className="grid sm:grid-cols-2 gap-3 mt-3 text-xs">
            {recap.topPelatih.length > 0 && (
              <div className="border rounded-md px-3 py-2">
                <div className="uppercase tracking-wider text-[10px] text-muted-foreground mb-1">Pelatih Teraktif</div>
                <div className="flex flex-wrap gap-1.5">
                  {recap.topPelatih.map(([n, c]) => (
                    <span key={n} className="inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-full">
                      <span>{n}</span><span className="text-muted-foreground">×{c}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {recap.topKurikulum.length > 0 && (
              <div className="border rounded-md px-3 py-2">
                <div className="uppercase tracking-wider text-[10px] text-muted-foreground mb-1">Kurikulum Terbanyak</div>
                <div className="flex flex-wrap gap-1.5">
                  {recap.topKurikulum.map(([n, c]) => (
                    <span key={n} className="inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-full">
                      <span>{n}</span><span className="text-muted-foreground">×{c}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {items.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          Tidak ada jadwal pada periode <b className="text-foreground">{range.label}</b>. Klik "Tambah Jadwal" atau pindah periode.
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(g => (
            <div key={g.key}>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{g.label}</div>
                <div className="h-px flex-1 bg-border" />
                <div className="text-xs text-muted-foreground">{g.items.length} jadwal</div>
              </div>
              <div className="grid lg:grid-cols-3 gap-4">
                {g.items.map(l => (
                  <Card key={l.id} className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">{l.tanggal} · {l.jam}</div>
                        <div className="mt-1 font-serif text-lg">{l.kurikulum}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3.5 w-3.5" />{l.tempat}</div>
                        <div className="text-xs text-muted-foreground mt-1">Ciri Adat: {l.ciriAdat}</div>
                        <div className="text-xs text-muted-foreground">Pelatih: {pelatihList.find(p => p.id === l.pelatihId)?.nama ?? "-"}</div>
                        {l.editedAt && (
                          <div className="text-[10px] mt-1 text-amber-700/80 dark:text-amber-400/80 italic">
                            Diedit {fmtDateTime(l.editedAt)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        {l.laporan ? <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2 py-1 rounded-full">Sudah Lapor</span> : <span className="text-[10px] uppercase tracking-wider bg-muted px-2 py-1 rounded-full">Menunggu</span>}
                        <LatihanFormDialog sg={sg} pelatihList={pelatihList} existing={l} />
                      </div>
                    </div>
                    {l.laporan ? (
                      <div className="mt-4">
                        <img src={l.laporan.fotoDataUrl} alt="laporan" className="w-full h-40 object-cover rounded-md" />
                        <div className="text-xs text-muted-foreground mt-2">{fmtDateTime(l.laporan.timestamp)} · {l.laporan.lat.toFixed(4)}, {l.laporan.lng.toFixed(4)}</div>
                      </div>
                    ) : (
                      <LaporDialog latihanId={l.id} />
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecapStat({ label, value, accent }: { label: string; value: number | string; accent?: "emerald" | "amber" | "primary" }) {
  const tone =
    accent === "emerald" ? "text-emerald-600 dark:text-emerald-400" :
    accent === "amber" ? "text-amber-600 dark:text-amber-400" :
    accent === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className="border rounded-md px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-2xl font-serif ${tone}`}>{value}</div>
    </div>
  );
}

function LatihanFormDialog({ sg, pelatihList, existing }: { sg: SanggarUser; pelatihList: PelatihUser[]; existing?: import("@/lib/types").Latihan }) {
  const isEdit = !!existing;
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const initial = existing
    ? { tanggal: existing.tanggal, jam: existing.jam, tempat: existing.tempat, kurikulum: existing.kurikulum, ciriAdat: existing.ciriAdat, pelatihId: existing.pelatihId ?? "" }
    : { tanggal: today, jam: "16:00", tempat: "Aula Sanggar", kurikulum: "Tari Topeng Betawi", ciriAdat: "Betawi Pesisir", pelatihId: pelatihList[0]?.id ?? "" };
  const [f, setF] = useState(initial);
  useEffect(() => { if (open) setF(initial); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open, existing?.id]);

  const submit = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.tanggal) || !/^\d{2}:\d{2}$/.test(f.jam)) {
      return;
    }
    if (isEdit && existing) {
      save(d => {
        const l = d.latihan.find(x => x.id === existing.id);
        if (l) {
          l.tanggal = f.tanggal; l.jam = f.jam; l.tempat = f.tempat;
          l.kurikulum = f.kurikulum; l.ciriAdat = f.ciriAdat; l.pelatihId = f.pelatihId;
          l.editedAt = Date.now();
        }
      });
      logActivity(sg.id, "sanggar", "edit-latihan");
    } else {
      save(d => {
        d.latihan.push({ id: uid(), sanggarId: sg.id, ...f });
      });
      logActivity(sg.id, "sanggar", "add-latihan");
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit
          ? <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs"><Pencil className="h-3 w-3" />Edit</Button>
          : <Button className="gap-2"><Plus className="h-4 w-4" />Tambah Jadwal</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEdit ? "Edit Jadwal Latihan" : "Tambah Jadwal Latihan"}</DialogTitle></DialogHeader>
        {isEdit && (
          <div className="text-xs text-amber-700/90 dark:text-amber-400/90 bg-amber-500/10 border border-amber-500/25 rounded-md px-3 py-2">
            Setelah diedit, unduh PDF jadwal akan diproteksi password Kurator.
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Tanggal</Label><Input type="date" value={f.tanggal} onChange={e => setF({ ...f, tanggal: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Jam</Label><Input type="time" value={f.jam} onChange={e => setF({ ...f, jam: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Tempat</Label><Input value={f.tempat} onChange={e => setF({ ...f, tempat: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Kurikulum</Label><Input value={f.kurikulum} onChange={e => setF({ ...f, kurikulum: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Ciri Adat</Label><Input value={f.ciriAdat} onChange={e => setF({ ...f, ciriAdat: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Pelatih</Label>
            <Select value={f.pelatihId} onValueChange={v => setF({ ...f, pelatihId: v })}>
              <SelectTrigger><SelectValue placeholder="Pilih pelatih" /></SelectTrigger>
              <SelectContent>{pelatihList.map(p => <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button onClick={submit}>{isEdit ? "Simpan Perubahan" : "Simpan"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LaporDialog({ latihanId }: { latihanId: string }) {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [shot, setShot] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && !stream) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(s => { setStream(s); if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play().catch(() => {}); } })
        .catch(() => toast({ title: "Tidak bisa mengakses kamera", description: "Foto demo akan digunakan.", variant: "destructive" }));
    }
    if (!open && stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); setShot(null); }
  }, [open]);

  const capture = () => {
    const v = videoRef.current; const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    c.width = 640; c.height = 480;
    if (v && v.videoWidth) ctx.drawImage(v, 0, 0, c.width, c.height);
    else { ctx.fillStyle = "#3a2a1f"; ctx.fillRect(0, 0, c.width, c.height); ctx.fillStyle = "#fff"; ctx.font = "20px sans-serif"; ctx.fillText("Foto Demo (Kamera Tidak Tersedia)", 80, 240); }
    const lat = -6.2 + Math.random() * 0.05; const lng = 106.8 + Math.random() * 0.05;
    const ts = new Date();
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0, c.height - 70, c.width, 70);
    ctx.fillStyle = "#fff"; ctx.font = "14px monospace";
    ctx.fillText(`${ts.toLocaleString("id-ID")}`, 12, c.height - 44);
    ctx.fillText(`GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`, 12, c.height - 22);
    setShot(c.toDataURL("image/jpeg", 0.7));
  };

  const submit = () => {
    if (!shot) return;
    save(d => {
      const l = d.latihan.find(x => x.id === latihanId);
      if (l) l.laporan = { fotoDataUrl: shot, timestamp: Date.now(), lat: -6.2 + Math.random() * 0.05, lng: 106.8 + Math.random() * 0.05 };
    });
    toast({ title: "Laporan latihan tersimpan" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="mt-3 w-full gap-2"><Camera className="h-4 w-4" />Lapor Latihan</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Laporan Latihan (GPS Camera)</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {!shot ? (
            <>
              <video ref={videoRef} className="w-full aspect-video bg-muted rounded-md" />
              <Button onClick={capture} className="w-full gap-2"><Camera className="h-4 w-4" />Ambil Foto</Button>
            </>
          ) : (
            <>
              <img src={shot} alt="hasil" className="w-full rounded-md" />
              <Button variant="outline" onClick={() => setShot(null)} className="w-full">Ambil Ulang</Button>
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={submit} disabled={!shot}>Kirim Laporan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
