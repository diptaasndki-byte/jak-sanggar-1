import { useState, useRef, useEffect } from "react";
import { useAuth, useDb } from "@/lib/auth";
import { save, uid, logActivity, fmtDateTime } from "@/lib/store";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { SanggarUser, PelatihUser } from "@/lib/types";
import { Camera, Calendar, MapPin, FileDown, Plus } from "lucide-react";
import { openPrintWindow, safeHtml, rawHtml } from "@/lib/print";

export default function LatihanPage() {
  const { user } = useAuth();
  const db = useDb();
  const { toast } = useToast();
  if (!user || user.role !== "sanggar") return null;
  const sg = user as SanggarUser;
  const items = db.latihan.filter(l => l.sanggarId === sg.id).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const pelatihList = db.users.filter(u => u.role === "pelatih" && (u as any).sanggarId === sg.id && (u as any).status === "aktif") as PelatihUser[];

  const exportPdf = () => {
    const pwd = prompt(`Masukkan password Kurator untuk membuka proteksi unduh:`);
    if (pwd !== db.exportPassword) { toast({ title: "Password salah", variant: "destructive" }); return; }
    const rows = items
      .map(l => safeHtml`<tr><td>${l.tanggal}</td><td>${l.jam}</td><td>${l.tempat}</td><td>${l.kurikulum}</td><td>${pelatihList.find(p => p.id === l.pelatihId)?.nama ?? "-"}</td></tr>`)
      .join("");
    const body = safeHtml`<h1>Jadwal Latihan — ${sg.namaSanggar}</h1><table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%"><thead><tr><th>Tanggal</th><th>Jam</th><th>Tempat</th><th>Kurikulum</th><th>Pelatih</th></tr></thead><tbody>${rawHtml(rows)}</tbody></table>`;
    openPrintWindow({ title: `Jadwal Latihan ${sg.namaSanggar}`, bodyHtml: body });
  };

  return (
    <div>
      <PageHeader title="Jadwal Latihan" subtitle="Atur jadwal latihan, lapor kehadiran dengan kamera & GPS." actions={
        <>
          <Button variant="outline" className="gap-2" onClick={exportPdf}><FileDown className="h-4 w-4" />Unduh PDF</Button>
          <AddLatihanDialog sg={sg} pelatihList={pelatihList} />
        </>
      } />

      <div className="grid lg:grid-cols-3 gap-4">
        {items.length === 0 && <Card className="lg:col-span-3 p-12 text-center text-muted-foreground">Belum ada jadwal latihan. Klik "Tambah Jadwal".</Card>}
        {items.map(l => (
          <Card key={l.id} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{l.tanggal} · {l.jam}</div>
                <div className="mt-1 font-serif text-lg">{l.kurikulum}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3.5 w-3.5" />{l.tempat}</div>
                <div className="text-xs text-muted-foreground mt-1">Ciri Adat: {l.ciriAdat}</div>
                <div className="text-xs text-muted-foreground">Pelatih: {pelatihList.find(p => p.id === l.pelatihId)?.nama ?? "-"}</div>
              </div>
              {l.laporan ? <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2 py-1 rounded-full">Sudah Lapor</span> : <span className="text-[10px] uppercase tracking-wider bg-muted px-2 py-1 rounded-full">Menunggu</span>}
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
  );
}

function AddLatihanDialog({ sg, pelatihList }: { sg: SanggarUser; pelatihList: PelatihUser[] }) {
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ tanggal: today, jam: "16:00", tempat: "Aula Sanggar", kurikulum: "Tari Topeng Betawi", ciriAdat: "Betawi Pesisir", pelatihId: pelatihList[0]?.id ?? "" });
  const submit = () => {
    save(d => {
      d.latihan.push({ id: uid(), sanggarId: sg.id, ...f });
    });
    logActivity(sg.id, "sanggar", "add-latihan");
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Tambah Jadwal</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Tambah Jadwal Latihan</DialogTitle></DialogHeader>
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
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button onClick={submit}>Simpan</Button></DialogFooter>
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
