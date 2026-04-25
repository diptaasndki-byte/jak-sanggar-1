import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth, useDb } from "@/lib/auth";
import { fmtRp } from "@/lib/store";
import { buildKatalog, createKerjasama, SATUAN_LABEL, type KatalogItem } from "@/lib/kerjasama";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import type { SanggarUser, KerjasamaKategori } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Music2, Shirt, Users as UsersIcon, Building2, Search, Send } from "lucide-react";

const KATEGORI_TABS: { key: KerjasamaKategori | "all"; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "sdm", label: "SDM" },
  { key: "alat_musik", label: "Alat Musik" },
  { key: "kostum", label: "Kostum" },
  { key: "tempat_latihan", label: "Tempat Latihan" },
];

function KategoriIcon({ k }: { k: KerjasamaKategori }) {
  if (k === "sdm") return <UsersIcon className="h-4 w-4" />;
  if (k === "alat_musik") return <Music2 className="h-4 w-4" />;
  if (k === "kostum") return <Shirt className="h-4 w-4" />;
  return <Building2 className="h-4 w-4" />;
}

function RequestDialog({ item, sg, onCreated }: { item: KatalogItem; sg: SanggarUser; onCreated: (id: string) => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [tanggalMulai, setTM] = useState(today);
  const [tanggalSelesai, setTS] = useState(today);
  const [lokasi, setLok] = useState("");
  const [jumlah, setJum] = useState(1);
  const [deskripsi, setDes] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Send className="h-3.5 w-3.5 mr-1" />Ajukan</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Ajukan Kerjasama</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <Card className="p-3 bg-muted/40">
            <div className="font-medium">{item.judul}</div>
            <div className="text-xs text-muted-foreground">{item.sanggarNama}</div>
            <div className="text-xs mt-1">{fmtRp(item.hargaSewa)} <span className="text-muted-foreground">{SATUAN_LABEL[item.satuanHarga]}</span></div>
          </Card>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tanggal Mulai</Label><Input type="date" value={tanggalMulai} onChange={e => setTM(e.target.value)} /></div>
            <div><Label>Tanggal Selesai</Label><Input type="date" value={tanggalSelesai} onChange={e => setTS(e.target.value)} /></div>
          </div>
          <div><Label>Lokasi Kegiatan</Label><Input value={lokasi} onChange={e => setLok(e.target.value)} placeholder="Mis. Aula RW 03 Condet" /></div>
          <div><Label>Jumlah ({SATUAN_LABEL[item.satuanHarga]})</Label><Input type="number" min={1} value={jumlah} onChange={e => setJum(Math.max(1, Number(e.target.value)))} /></div>
          <div><Label>Deskripsi Kebutuhan</Label><Textarea rows={3} value={deskripsi} onChange={e => setDes(e.target.value)} placeholder="Konteks kegiatan, kebutuhan teknis, dll." /></div>
          <div className="text-xs p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded">
            Estimasi nilai awal: <span className="font-semibold">{fmtRp(item.hargaSewa * Math.max(1, jumlah))}</span>. Nilai akhir bisa berubah lewat negosiasi.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={() => {
            if (item.sanggarId === sg.id) { toast({ title: "Tidak bisa ajukan ke sanggar sendiri", variant: "destructive" }); return; }
            if (!lokasi.trim()) { toast({ title: "Lokasi wajib diisi", variant: "destructive" }); return; }
            const r = createKerjasama({
              katalog: item, peminjamSanggarId: sg.id, actor: { id: sg.id, role: "sanggar" },
              tanggalMulai, tanggalSelesai, lokasi, jumlah, deskripsi,
            });
            if (!r.ok || !r.kerjasama) { toast({ title: "Gagal", description: r.reason, variant: "destructive" }); return; }
            toast({ title: "Permintaan terkirim", description: `Nomor ${r.kerjasama.nomor}` });
            setOpen(false); onCreated(r.kerjasama.id);
          }}><Send className="h-4 w-4 mr-1" />Kirim Permintaan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function KatalogKerjasama() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const sg = user as SanggarUser;
  const db = useDb();
  const [q, setQ] = useState("");
  // Recompute when DB changes (users / aset / sarpras / kerjasama)
  const items = useMemo(() => buildKatalog(), [db.users, db.aset, db.sarpras, db.kerjasama]);
  if (!user || user.role !== "sanggar") return null;

  const filterFn = (k: KatalogItem) => {
    if (k.sanggarId === sg.id) return false; // jangan tampilkan punya sendiri
    if (!q) return true;
    const t = q.toLowerCase();
    return k.judul.toLowerCase().includes(t) || k.sanggarNama.toLowerCase().includes(t) || k.deskripsi.toLowerCase().includes(t);
  };

  const byKategori = (kat: KerjasamaKategori | "all") =>
    items.filter(filterFn).filter(i => kat === "all" || i.kategori === kat);

  return (
    <div>
      <PageHeader title="Katalog Kerjasama" subtitle="Pinjam/ajukan kolaborasi SDM, alat musik, kostum, atau tempat latihan dari sanggar lain. Katalog dibangun otomatis dari profil setiap sanggar." />
      <div className="mb-4 flex items-center gap-2 max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari sanggar / SDM / aset / tempat..." value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <Tabs defaultValue="all">
        <TabsList className="flex-wrap">
          {KATEGORI_TABS.map(t => <TabsTrigger key={t.key} value={t.key}>{t.label} ({byKategori(t.key as any).length})</TabsTrigger>)}
        </TabsList>
        {KATEGORI_TABS.map(t => (
          <TabsContent key={t.key} value={t.key}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {byKategori(t.key as any).length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-12">Belum ada item.</div>
              )}
              {byKategori(t.key as any).map(item => (
                <Card key={item.id} className="overflow-hidden flex flex-col">
                  {item.fotoDataUrl ? (
                    <img src={item.fotoDataUrl} className="h-32 w-full object-cover" alt="" />
                  ) : (
                    <div className="h-32 w-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-primary/40">
                      <KategoriIcon k={item.kategori} />
                    </div>
                  )}
                  <div className="p-3 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-sm leading-tight">{item.judul}</div>
                      <Badge variant="secondary" className="text-xs gap-1"><KategoriIcon k={item.kategori} />{item.kategori.replace("_", " ")}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{item.sanggarNama}</div>
                    <div className="text-xs mt-2 flex-1 line-clamp-2">{item.deskripsi}</div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm font-semibold">{fmtRp(item.hargaSewa)} <span className="text-xs text-muted-foreground font-normal">{SATUAN_LABEL[item.satuanHarga]}</span></div>
                      <RequestDialog item={item} sg={sg} onCreated={(id) => navigate(`/sanggar/kerjasama/${id}`)} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
