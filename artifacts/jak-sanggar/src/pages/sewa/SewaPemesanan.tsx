// =============================================================
// Halaman alur Sewa Jasa (penyewa eksternal):
//   - SewaItemDetail   : detail item katalog + form buat pesanan
//   - SewaPesananList  : daftar pesanan milik penyewa
//   - SewaPesananDetail: detail kontrak + tombol Setuju, bayar, dsb.
// =============================================================
import { useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useAuth, useDb } from "@/lib/auth";
import { fmtRp } from "@/lib/store";
import { getKatalogItem, SATUAN_LABEL } from "@/lib/kerjasama";
import {
  AKOMODASI_LABEL, STATUS_PEMESANAN_LABEL, STATUS_PEMESANAN_COLOR,
  defaultAkomodasi, hitungTotal, listPemesananForActor,
  createPemesanan, tandaTangan, batalkanPemesanan, uploadBuktiBayar,
  pihakWajib, sudahTtd, namaPihak, progressTtd,
} from "@/lib/sewa-flow";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2, MapPin, ShoppingBag, ArrowRight, Calendar as CalendarIcon,
  Receipt, FileSignature, Upload, CheckCircle2, XCircle, Banknote, FileText,
} from "lucide-react";
import type { AkomodasiMode, PemesananSewa, PihakSewa, SewaUser } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(f);
  });
}

// ============= DETAIL ITEM + FORM PESAN =============

export function SewaItemDetail() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/sewa/item/:id");
  const { toast } = useToast();
  const itemId = params?.id ?? "";
  const item = useMemo(() => getKatalogItem(itemId), [itemId]);

  const def = useMemo(() => item ? defaultAkomodasi(item) : { mode: "diluar" as AkomodasiMode, biaya: 0 }, [item]);

  const [tanggalMulai, setTanggalMulai] = useState(todayStr());
  const [tanggalSelesai, setTanggalSelesai] = useState(todayStr());
  const [lokasi, setLokasi] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [catatan, setCatatan] = useState("");
  const [akom, setAkom] = useState<AkomodasiMode>(def.mode);
  const [biaya, setBiaya] = useState(def.biaya);

  if (!user || user.role !== "sewa") return null;
  const sewa = user as SewaUser;
  if (!item) {
    return (
      <div>
        <PageHeader title="Item tidak ditemukan" backTo="/sewa" />
        <Card className="p-8 text-center text-muted-foreground">
          Item katalog tidak ditemukan atau sudah dihapus.
        </Card>
      </div>
    );
  }

  const total = hitungTotal({
    hargaDasar: item.hargaSewa, jumlah, akomodasiPP: akom, biayaAkomodasi: biaya,
  });

  function submit() {
    if (!item) return;
    const r = createPemesanan({
      katalog: item, sewaId: sewa.id,
      tanggalMulai, tanggalSelesai, lokasi, jumlah, catatan,
      akomodasiPP: akom, biayaAkomodasi: biaya,
      actor: { id: sewa.id, role: "sewa" },
    });
    if (!r.ok || !r.pemesanan) {
      toast({ title: "Gagal membuat pesanan", description: r.reason, variant: "destructive" });
      return;
    }
    toast({ title: "Pesanan terkirim", description: `Nomor ${r.pemesanan.nomor} menunggu konfirmasi sanggar.` });
    navigate(`/sewa/pesanan/${r.pemesanan.id}`);
  }

  return (
    <div>
      <PageHeader title={item.judul} subtitle={`Penyedia: ${item.sanggarNama}`} back />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="overflow-hidden lg:col-span-1">
          {item.fotoDataUrl ? (
            <img src={item.fotoDataUrl} className="w-full h-56 object-cover" alt="" />
          ) : (
            <div className="w-full h-56 bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-primary/40">
              <ShoppingBag className="h-10 w-10" />
            </div>
          )}
          <div className="p-4 space-y-2">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" /> {item.sanggarNama}
            </div>
            <div className="text-sm">{item.deskripsi}</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {item.jenisKesenian.map(k => <Badge key={k} variant="secondary" className="text-[10px]">{k}</Badge>)}
            </div>
            <div className="pt-3 border-t mt-3">
              <div className="text-xs text-muted-foreground">Harga Dasar</div>
              <div className="text-xl font-semibold text-primary">
                {fmtRp(item.hargaSewa)} <span className="text-xs text-muted-foreground font-normal">{SATUAN_LABEL[item.satuanHarga]}</span>
              </div>
              <Badge variant="outline" className={`mt-2 text-[10px] ${item.akomodasiPP === "termasuk" ? "border-emerald-300 text-emerald-700" : "border-amber-300 text-amber-700"}`}>
                Default: {AKOMODASI_LABEL[item.akomodasiPP]}
                {item.akomodasiPP === "diluar" && item.biayaAkomodasi > 0 && ` (+${fmtRp(item.biayaAkomodasi)})`}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-4 lg:col-span-2 space-y-3">
          <div className="font-medium flex items-center gap-2">
            <Receipt className="h-4 w-4" /> Form Pemesanan
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tanggal Mulai</Label>
              <Input type="date" value={tanggalMulai} onChange={e => setTanggalMulai(e.target.value)} data-testid="input-tgl-mulai" />
            </div>
            <div>
              <Label>Tanggal Selesai</Label>
              <Input type="date" value={tanggalSelesai} onChange={e => setTanggalSelesai(e.target.value)} data-testid="input-tgl-selesai" />
            </div>
          </div>
          <div>
            <Label>Lokasi Acara</Label>
            <Input value={lokasi} onChange={e => setLokasi(e.target.value)} placeholder="Alamat lengkap acara" data-testid="input-lokasi" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Jumlah ({SATUAN_LABEL[item.satuanHarga]})</Label>
              <Input type="number" min={1} value={jumlah} onChange={e => setJumlah(Math.max(1, Number(e.target.value)))} data-testid="input-jumlah" />
            </div>
            <div>
              <Label>Akomodasi PP</Label>
              <Select value={akom} onValueChange={v => setAkom(v as AkomodasiMode)}>
                <SelectTrigger data-testid="select-akomodasi"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="termasuk">Termasuk akomodasi PP</SelectItem>
                  <SelectItem value="diluar">Di luar akomodasi PP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Biaya Akomodasi (Rp)</Label>
            <Input
              type="number" min={0}
              value={biaya}
              disabled={akom === "termasuk"}
              onChange={e => setBiaya(Math.max(0, Number(e.target.value)))}
              data-testid="input-biaya-akomodasi"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Default dari sanggar: {AKOMODASI_LABEL[def.mode]}
              {def.mode === "diluar" && def.biaya > 0 && ` — ${fmtRp(def.biaya)}`}
            </p>
          </div>
          <div>
            <Label>Catatan untuk Sanggar (opsional)</Label>
            <Textarea rows={2} value={catatan} onChange={e => setCatatan(e.target.value)} data-testid="input-catatan" />
          </div>
          <div className="rounded-md bg-muted/40 p-3 mt-2 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Estimasi Total</div>
              <div className="text-2xl font-semibold text-primary" data-testid="text-total">{fmtRp(total)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                ({fmtRp(item.hargaSewa)} × {jumlah})
                {akom === "diluar" && biaya > 0 && ` + akomodasi ${fmtRp(biaya)}`}
              </div>
            </div>
            <Button onClick={submit} className="gap-2" data-testid="button-pesan">
              Kirim Pesanan <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============= LIST PESANAN PENYEWA =============

export function SewaPesananList() {
  const { user } = useAuth();
  const db = useDb();
  if (!user || user.role !== "sewa") return null;
  const list = useMemo(() => listPemesananForActor({ id: user.id, role: "sewa" }), [db.pemesananSewa, user.id]);

  return (
    <div>
      <PageHeader
        title="Pesanan Saya"
        subtitle="Pantau alur pemesanan: konfirmasi sanggar/SDM → tanda tangan → invoice → pembayaran → BAST."
        backTo="/sewa"
      />
      {list.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <div className="mb-3">Belum ada pesanan. Telusuri katalog dan klik item yang ingin dipesan.</div>
          <Button asChild><Link href="/sewa">Buka Katalog</Link></Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map(p => <PesananRow key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}

function PesananRow({ p }: { p: PemesananSewa }) {
  const prog = progressTtd(p);
  return (
    <Link href={`/sewa/pesanan/${p.id}`}>
      <Card className="p-3 cursor-pointer hover-elevate active-elevate-2 transition-all" data-testid={`row-pesanan-${p.id}`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="font-medium leading-tight">{p.judul}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {p.nomor} · {p.tanggalMulai}{p.tanggalSelesai !== p.tanggalMulai ? ` → ${p.tanggalSelesai}` : ""}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {p.lokasi}
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className={STATUS_PEMESANAN_COLOR[p.status]}>{STATUS_PEMESANAN_LABEL[p.status]}</Badge>
            <div className="text-sm font-semibold text-primary mt-1">{fmtRp(p.nilaiTotal)}</div>
            {p.status === "menunggu_ttd" && (
              <div className="text-[10px] text-muted-foreground mt-0.5">TTD {prog.selesai}/{prog.total}</div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

// ============= DETAIL PESANAN (PENYEWA) =============

export function SewaPesananDetail() {
  const { user } = useAuth();
  const [, params] = useRoute("/sewa/pesanan/:id");
  const db = useDb();
  if (!user || user.role !== "sewa") return null;
  const id = params?.id ?? "";
  const p = db.pemesananSewa.find(x => x.id === id);
  if (!p) {
    return (
      <div>
        <PageHeader title="Pesanan tidak ditemukan" backTo="/sewa/pesanan" />
        <Card className="p-8 text-center text-muted-foreground">Pesanan tidak ditemukan.</Card>
      </div>
    );
  }
  if (p.sewaId !== user.id) {
    return (
      <div>
        <PageHeader title="Akses ditolak" backTo="/sewa/pesanan" />
        <Card className="p-8 text-center text-muted-foreground">Anda tidak memiliki akses ke pesanan ini.</Card>
      </div>
    );
  }
  return <PesananDetailView p={p} actorRole="sewa" />;
}

// =====================================================================
// VIEW UMUM detail pesanan — dipakai oleh sewa, sanggar, dan SDM dengan
// aksi yang berbeda berdasarkan `actorRole`.
// =====================================================================
export function PesananDetailView({ p, actorRole }: { p: PemesananSewa; actorRole: "sewa" | "sanggar" | "sdm" }) {
  const { user } = useAuth();
  const db = useDb();
  const { toast } = useToast();
  const [showBatal, setShowBatal] = useState(false);
  const [showBayar, setShowBayar] = useState(false);
  const [bayarNominal, setBayarNominal] = useState(p.nilaiTotal);
  const [bayarTgl, setBayarTgl] = useState(todayStr());
  const [bayarBukti, setBayarBukti] = useState<string | undefined>();
  if (!user) return null;

  const wajib = pihakWajib(p);
  const inv = p.invoiceId ? db.invoices.find(i => i.id === p.invoiceId) : undefined;
  const bast = p.bastId ? db.bast.find(b => b.id === p.bastId) : undefined;
  const payments = inv ? db.payments.filter(x => x.invoiceId === inv.id) : [];

  const myPihak: PihakSewa | null =
    actorRole === "sewa" && p.sewaId === user.id ? "sewa"
    : actorRole === "sanggar" && p.sanggarId === user.id ? "sanggar"
    : actorRole === "sdm" && p.sdmUserId === user.id ? "sdm"
    : null;

  function doSign() {
    const r = tandaTangan({ id: p.id, actor: { id: user!.id, role: user!.role } });
    if (!r.ok) { toast({ title: "Gagal tanda tangan", description: r.reason, variant: "destructive" }); return; }
    toast({ title: "Tanda tangan tersimpan", description: r.semuaTtd ? "Semua pihak sudah setuju — kontrak aktif." : "Menunggu pihak lain." });
  }
  function doBatal() {
    const r = batalkanPemesanan(p.id, { id: user!.id, role: user!.role });
    if (!r.ok) { toast({ title: "Gagal batalkan", description: r.reason, variant: "destructive" }); return; }
    toast({ title: "Pesanan dibatalkan" });
    setShowBatal(false);
  }
  async function doUploadBukti() {
    const r = uploadBuktiBayar({
      pemesananId: p.id, nominal: bayarNominal, tanggalBayar: new Date(bayarTgl).getTime(),
      buktiDataUrl: bayarBukti, actor: { id: user!.id, role: user!.role },
    });
    if (!r.ok) { toast({ title: "Gagal kirim bukti bayar", description: r.reason, variant: "destructive" }); return; }
    toast({ title: "Bukti bayar terkirim", description: "Menunggu verifikasi sanggar." });
    setShowBayar(false);
  }

  return (
    <div>
      <PageHeader
        title={`Pesanan ${p.nomor}`}
        subtitle={p.judul}
        backTo={actorRole === "sewa" ? "/sewa/pesanan"
          : actorRole === "sanggar" ? "/sanggar/permintaan-sewa"
          : `/${user.role}/penugasan-sewa`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Badge variant="outline" className={STATUS_PEMESANAN_COLOR[p.status]} data-testid="badge-status">{STATUS_PEMESANAN_LABEL[p.status]}</Badge>
              <div className="text-sm text-muted-foreground">{new Date(p.createdAt).toLocaleString("id-ID")}</div>
            </div>
            {p.alasanTolak && (
              <div className="rounded bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 text-xs p-2 border border-rose-200">
                Alasan: {p.alasanTolak}
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm pt-2 border-t mt-2">
              <div>
                <div className="text-xs text-muted-foreground">Tanggal</div>
                <div className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {p.tanggalMulai} → {p.tanggalSelesai}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Lokasi</div>
                <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.lokasi}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Jumlah</div>
                <div>{p.jumlah} {SATUAN_LABEL[p.satuanHarga]}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Akomodasi PP</div>
                <div>{AKOMODASI_LABEL[p.akomodasiPP]}{p.akomodasiPP === "diluar" && ` — ${fmtRp(p.biayaAkomodasi)}`}</div>
              </div>
              {p.catatan && (
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground">Catatan</div>
                  <div className="whitespace-pre-wrap">{p.catatan}</div>
                </div>
              )}
            </div>
            <div className="rounded bg-muted/40 p-3 mt-2 flex items-center justify-between">
              <div className="text-sm">
                <div>{fmtRp(p.hargaDasar)} × {p.jumlah}{p.akomodasiPP === "diluar" && p.biayaAkomodasi > 0 && ` + ${fmtRp(p.biayaAkomodasi)}`}</div>
              </div>
              <div className="text-xl font-semibold text-primary">{fmtRp(p.nilaiTotal)}</div>
            </div>
          </Card>

          {/* Kontrak / TTD */}
          <Card className="p-4">
            <div className="font-medium flex items-center gap-2 mb-2">
              <FileSignature className="h-4 w-4" /> Kontrak Para Pihak
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Kontrak menjadi aktif setelah {wajib.length} pihak menekan tombol <span className="font-medium">Setuju</span>.
            </p>
            <div className="space-y-2">
              {wajib.map(pihak => {
                const ttd = p.ttd.find(t => t.pihak === pihak);
                const labelMap: Record<PihakSewa, string> = { sewa: "Penyewa", sanggar: "Sanggar Penyedia", sdm: "Seniman / Pelatih" };
                return (
                  <div key={pihak} className="flex items-center justify-between rounded border p-2.5">
                    <div>
                      <div className="text-xs text-muted-foreground">{labelMap[pihak]}</div>
                      <div className="text-sm font-medium">{namaPihak(p, pihak)}</div>
                      {ttd && <div className="text-[10px] text-muted-foreground">TTD: {new Date(ttd.ts).toLocaleString("id-ID")}</div>}
                    </div>
                    <div>
                      {ttd ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Sudah Setuju
                        </Badge>
                      ) : myPihak === pihak && p.status === "menunggu_ttd" ? (
                        <Button size="sm" onClick={doSign} data-testid={`button-setuju-${pihak}`}>Setuju</Button>
                      ) : (
                        <Badge variant="secondary">Menunggu</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Invoice */}
          {inv && (
            <Card className="p-4">
              <div className="font-medium flex items-center gap-2 mb-2">
                <Receipt className="h-4 w-4" /> Invoice {inv.nomor}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground text-xs">Total: </span>{fmtRp(inv.total)}</div>
                <div><span className="text-muted-foreground text-xs">Status: </span>{inv.status}</div>
                <div className="col-span-2 text-xs text-muted-foreground">
                  Batas bayar: {new Date(inv.batasPembayaran).toLocaleDateString("id-ID")}
                </div>
              </div>
              {payments.length > 0 && (
                <div className="mt-3 space-y-1">
                  <div className="text-xs text-muted-foreground">Riwayat Pembayaran:</div>
                  {payments.map(pay => (
                    <div key={pay.id} className="flex items-center justify-between text-xs border rounded p-2">
                      <div>
                        <div>{fmtRp(pay.nominal)} · {new Date(pay.tanggalBayar).toLocaleDateString("id-ID")}</div>
                        {pay.catatanVerifikator && <div className="text-muted-foreground">Catatan: {pay.catatanVerifikator}</div>}
                      </div>
                      <Badge variant={pay.status === "disetujui" ? "default" : pay.status === "ditolak" ? "destructive" : "secondary"}>
                        {pay.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              {actorRole === "sewa" && p.status === "menunggu_bayar" && !payments.some(x => x.status === "menunggu" || x.status === "disetujui") && (
                <div className="mt-3">
                  <Button onClick={() => setShowBayar(s => !s)} className="gap-2" data-testid="button-toggle-bayar">
                    <Banknote className="h-4 w-4" /> {showBayar ? "Tutup Form Bayar" : "Kirim Bukti Bayar"}
                  </Button>
                  {showBayar && (
                    <div className="mt-3 space-y-2 border rounded p-3 bg-muted/30">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Nominal (Rp)</Label>
                          <Input type="number" value={bayarNominal} onChange={e => setBayarNominal(Number(e.target.value))} data-testid="input-bayar-nominal" />
                        </div>
                        <div>
                          <Label className="text-xs">Tanggal Bayar</Label>
                          <Input type="date" value={bayarTgl} onChange={e => setBayarTgl(e.target.value)} data-testid="input-bayar-tgl" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Bukti Pembayaran (gambar)</Label>
                        <Input type="file" accept="image/*" onChange={async e => {
                          const f = e.target.files?.[0]; if (!f) return;
                          const url = await fileToDataUrl(f); setBayarBukti(url);
                        }} data-testid="input-bayar-bukti" />
                        {bayarBukti && <img src={bayarBukti} className="mt-2 h-24 rounded border object-cover" alt="" />}
                      </div>
                      <Button size="sm" onClick={doUploadBukti} className="gap-2" data-testid="button-kirim-bayar">
                        <Upload className="h-4 w-4" /> Kirim Bukti
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* BAST */}
          {bast && (
            <Card className="p-4">
              <div className="font-medium flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" /> BAST {bast.nomor}
              </div>
              <div className="text-sm">
                Status: <Badge variant={bast.status === "final" ? "default" : "secondary"}>{bast.status}</Badge>
              </div>
              {bast.finalAt && <div className="text-xs text-muted-foreground mt-1">Difinalkan: {new Date(bast.finalAt).toLocaleString("id-ID")}</div>}
            </Card>
          )}
        </div>

        {/* Aksi sidebar */}
        <div>
          <Card className="p-4 space-y-2">
            <div className="font-medium text-sm">Aksi</div>
            {actorRole === "sewa" && !["selesai", "ditolak", "batal"].includes(p.status) && (
              <>
                {!showBatal ? (
                  <Button variant="outline" className="w-full gap-2" onClick={() => setShowBatal(true)} data-testid="button-batal">
                    <XCircle className="h-4 w-4" /> Batalkan Pesanan
                  </Button>
                ) : (
                  <div className="rounded border p-2 space-y-2">
                    <p className="text-xs">Pesanan akan dibatalkan permanen. Lanjutkan?</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={doBatal} data-testid="button-batal-confirm">Batalkan</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowBatal(false)}>Tidak</Button>
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Status terakhir diperbarui {new Date(p.updatedAt).toLocaleString("id-ID")}.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
