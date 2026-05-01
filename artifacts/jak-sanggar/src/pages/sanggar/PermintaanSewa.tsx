// =============================================================
// Halaman SANGGAR untuk menangani permintaan dari penyewa eksternal:
//   - PermintaanSewaMasuk : daftar pesanan masuk
//   - PermintaanSewaDetail: detail + aksi (assign SDM, terima/tolak,
//                           setuju, terbitkan invoice, verifikasi bayar,
//                           finalisasi BAST)
// =============================================================
import { useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { useAuth, useDb } from "@/lib/auth";
import { fmtRp } from "@/lib/store";
import { SATUAN_LABEL } from "@/lib/kerjasama";
import {
  STATUS_PEMESANAN_LABEL, STATUS_PEMESANAN_COLOR, AKOMODASI_LABEL,
  listPemesananForActor, terimaPemesanan, tolakPemesanan,
  terbitkanInvoice, verifikasiPembayaran, finalkanBast,
  pihakWajib, namaPihak, tandaTangan,
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
  MapPin, FileSignature, Receipt, CheckCircle2, XCircle, FileText,
  Calendar as CalendarIcon, Inbox, UserCheck,
} from "lucide-react";
import type { PelatihUser, PemesananSewa, PihakSewa, SanggarUser, SenimanUser } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export function PermintaanSewaMasuk() {
  const { user } = useAuth();
  const db = useDb();
  if (!user || user.role !== "sanggar") return null;
  const list = useMemo(
    () => listPemesananForActor({ id: user.id, role: "sanggar" })
      .sort((a, b) => b.createdAt - a.createdAt),
    [db.pemesananSewa, user.id],
  );

  const tabs: { key: "aktif" | "selesai" | "ditolak"; label: string; filter: (p: PemesananSewa) => boolean }[] = [
    { key: "aktif", label: "Aktif", filter: p => !["selesai", "ditolak", "batal"].includes(p.status) },
    { key: "selesai", label: "Selesai", filter: p => p.status === "selesai" },
    { key: "ditolak", label: "Ditolak/Batal", filter: p => p.status === "ditolak" || p.status === "batal" },
  ];
  const [tab, setTab] = useState<typeof tabs[number]["key"]>("aktif");
  const tabList = list.filter(tabs.find(t => t.key === tab)!.filter);

  return (
    <div>
      <PageHeader
        title="Permintaan Sewa Masuk"
        subtitle="Pesanan dari penyewa jasa eksternal. Konfirmasi, tugaskan SDM, lalu tandatangani kontrak."
      />
      <div className="flex gap-2 mb-3">
        {tabs.map(t => (
          <Button
            key={t.key}
            size="sm"
            variant={t.key === tab ? "default" : "outline"}
            onClick={() => setTab(t.key)}
            data-testid={`tab-${t.key}`}
          >
            {t.label} ({list.filter(t.filter).length})
          </Button>
        ))}
      </div>
      {tabList.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40" />
          Belum ada permintaan pada kategori ini.
        </Card>
      ) : (
        <div className="space-y-2">
          {tabList.map(p => (
            <Link key={p.id} href={`/sanggar/permintaan-sewa/${p.id}`}>
              <Card className="p-3 cursor-pointer hover-elevate active-elevate-2 transition-all" data-testid={`row-permintaan-${p.id}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-medium leading-tight">{p.judul}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {p.nomor} · Penyewa: {namaPihak(p, "sewa")}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" /> {p.tanggalMulai} → {p.tanggalSelesai}
                      <MapPin className="h-3 w-3 ml-2" /> {p.lokasi}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={STATUS_PEMESANAN_COLOR[p.status]}>{STATUS_PEMESANAN_LABEL[p.status]}</Badge>
                    <div className="text-sm font-semibold text-primary mt-1">{fmtRp(p.nilaiTotal)}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function PermintaanSewaDetail() {
  const { user } = useAuth();
  const db = useDb();
  const [, params] = useRoute("/sanggar/permintaan-sewa/:id");
  const { toast } = useToast();
  const [alasan, setAlasan] = useState("");
  const [showTolak, setShowTolak] = useState(false);
  const [assignId, setAssignId] = useState<string>("");
  const [dueDays, setDueDays] = useState(7);
  const [verCatatan, setVerCatatan] = useState("");
  if (!user || user.role !== "sanggar") return null;

  const id = params?.id ?? "";
  const p = db.pemesananSewa.find(x => x.id === id);
  if (!p) {
    return (
      <div>
        <PageHeader title="Pesanan tidak ditemukan" backTo="/sanggar/permintaan-sewa" />
        <Card className="p-8 text-center text-muted-foreground">Pesanan tidak ditemukan.</Card>
      </div>
    );
  }
  if (p.sanggarId !== user.id) {
    return (
      <div>
        <PageHeader title="Akses ditolak" backTo="/sanggar/permintaan-sewa" />
        <Card className="p-8 text-center text-muted-foreground">Pesanan ini bukan milik sanggar Anda.</Card>
      </div>
    );
  }

  const sg = user as SanggarUser;
  const isSdm = p.sumberType === "sdm-pelatih" || p.sumberType === "sdm-seniman";
  const wajib = pihakWajib(p);
  const inv = p.invoiceId ? db.invoices.find(i => i.id === p.invoiceId) : undefined;
  const bast = p.bastId ? db.bast.find(b => b.id === p.bastId) : undefined;
  const payments = inv ? db.payments.filter(x => x.invoiceId === inv.id) : [];
  const pendingPay = payments.find(pay => pay.status === "menunggu");

  // Daftar SDM untuk assign (jika sumber SDM tanpa target spesifik).
  const sdmOptions = useMemo(() => {
    const arr: Array<{ id: string; label: string }> = [];
    for (const u of db.users) {
      if ((u.role === "pelatih" || u.role === "seniman")) {
        const m = u as PelatihUser | SenimanUser;
        if (m.sanggarId === sg.id && m.status === "aktif") {
          arr.push({ id: m.id, label: `${m.nama} (${u.role}, ${m.jenisKesenian})` });
        }
      }
    }
    return arr;
  }, [db.users, sg.id]);

  function doTerima() {
    const r = terimaPemesanan({
      id: p!.id,
      assignSdmUserId: assignId || undefined,
      actor: { id: user!.id, role: "sanggar" },
    });
    if (!r.ok) { toast({ title: "Gagal terima", description: r.reason, variant: "destructive" }); return; }
    toast({ title: "Pesanan diterima" });
  }
  function doTolak() {
    if (!alasan.trim()) { toast({ title: "Isi alasan", variant: "destructive" }); return; }
    const r = tolakPemesanan(p!.id, alasan, { id: user!.id, role: "sanggar" });
    if (!r.ok) { toast({ title: "Gagal tolak", description: r.reason, variant: "destructive" }); return; }
    toast({ title: "Pesanan ditolak" });
    setShowTolak(false);
  }
  function doSign() {
    const r = tandaTangan({ id: p!.id, actor: { id: user!.id, role: "sanggar" } });
    if (!r.ok) { toast({ title: "Gagal tanda tangan", description: r.reason, variant: "destructive" }); return; }
    toast({ title: "Tanda tangan tersimpan", description: r.semuaTtd ? "Semua pihak sudah setuju — kontrak aktif." : "Menunggu pihak lain." });
  }
  function doInvoice() {
    const r = terbitkanInvoice(p!.id, dueDays, { id: user!.id, role: "sanggar" });
    if (!r.ok) { toast({ title: "Gagal terbitkan invoice", description: r.reason, variant: "destructive" }); return; }
    toast({ title: "Invoice diterbitkan", description: r.invoice?.nomor });
  }
  function doVerifikasi(terima: boolean) {
    if (!pendingPay) return;
    const r = verifikasiPembayaran({
      pemesananId: p!.id, paymentId: pendingPay.id, terima,
      catatan: verCatatan || undefined,
      actor: { id: user!.id, role: "sanggar" },
    });
    if (!r.ok) { toast({ title: "Gagal verifikasi", description: r.reason, variant: "destructive" }); return; }
    toast({ title: terima ? "Pembayaran disetujui" : "Pembayaran ditolak" });
    setVerCatatan("");
  }
  function doBast() {
    const r = finalkanBast(p!.id, { id: user!.id, role: "sanggar" });
    if (!r.ok) { toast({ title: "Gagal BAST", description: r.reason, variant: "destructive" }); return; }
    toast({ title: "BAST difinalkan", description: r.bast?.nomor });
  }

  const myTtd = p.ttd.find(t => t.pihak === "sanggar");

  return (
    <div>
      <PageHeader
        title={`Pesanan ${p.nomor}`}
        subtitle={`${p.judul} — Penyewa: ${namaPihak(p, "sewa")}`}
        backTo="/sanggar/permintaan-sewa"
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Ringkasan */}
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
                  <div className="text-xs text-muted-foreground">Catatan Penyewa</div>
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

          {/* Kontrak */}
          {p.status !== "menunggu_sanggar" && p.status !== "menunggu_sdm" && (
            <Card className="p-4">
              <div className="font-medium flex items-center gap-2 mb-2">
                <FileSignature className="h-4 w-4" /> Kontrak Para Pihak
              </div>
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
                        ) : pihak === "sanggar" && p.status === "menunggu_ttd" ? (
                          <Button size="sm" onClick={doSign} data-testid="button-setuju-sanggar">Setuju</Button>
                        ) : (
                          <Badge variant="secondary">Menunggu</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Invoice + Pembayaran */}
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
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-muted-foreground">Riwayat Pembayaran:</div>
                  {payments.map(pay => (
                    <div key={pay.id} className="border rounded p-2 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div>{fmtRp(pay.nominal)} · {new Date(pay.tanggalBayar).toLocaleDateString("id-ID")}</div>
                        <Badge variant={pay.status === "disetujui" ? "default" : pay.status === "ditolak" ? "destructive" : "secondary"}>
                          {pay.status}
                        </Badge>
                      </div>
                      {pay.buktiDataUrl && <img src={pay.buktiDataUrl} className="h-24 rounded border object-contain mt-1" alt="" />}
                      {pay.catatanVerifikator && <div className="text-muted-foreground">Catatan: {pay.catatanVerifikator}</div>}
                    </div>
                  ))}
                </div>
              )}
              {pendingPay && (
                <div className="mt-3 border rounded p-3 bg-muted/30 space-y-2">
                  <div className="text-sm font-medium">Verifikasi Pembayaran</div>
                  <div>
                    <Label className="text-xs">Catatan (opsional)</Label>
                    <Textarea rows={2} value={verCatatan} onChange={e => setVerCatatan(e.target.value)} data-testid="input-verifikasi-catatan" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => doVerifikasi(true)} className="gap-1" data-testid="button-verifikasi-terima">
                      <CheckCircle2 className="h-4 w-4" /> Setujui Pembayaran
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => doVerifikasi(false)} className="gap-1" data-testid="button-verifikasi-tolak">
                      <XCircle className="h-4 w-4" /> Tolak
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {bast && (
            <Card className="p-4">
              <div className="font-medium flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" /> BAST {bast.nomor}
              </div>
              <Badge variant={bast.status === "final" ? "default" : "secondary"}>{bast.status}</Badge>
              {bast.finalAt && <div className="text-xs text-muted-foreground mt-1">Difinalkan: {new Date(bast.finalAt).toLocaleString("id-ID")}</div>}
            </Card>
          )}
        </div>

        {/* Sidebar Aksi */}
        <div className="space-y-3">
          <Card className="p-4 space-y-2">
            <div className="font-medium text-sm">Aksi</div>

            {p.status === "menunggu_sanggar" && (
              <>
                {isSdm && !p.sdmUserId && (
                  <div>
                    <Label className="text-xs flex items-center gap-1"><UserCheck className="h-3 w-3" /> Tugaskan</Label>
                    <Select value={assignId} onValueChange={setAssignId}>
                      <SelectTrigger data-testid="select-assign-sdm"><SelectValue placeholder="Pilih anggota" /></SelectTrigger>
                      <SelectContent>
                        {sdmOptions.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {isSdm && p.sdmUserId && (
                  <div className="text-xs text-muted-foreground">
                    Sudah otomatis ditugaskan ke <span className="font-medium">{namaPihak(p, "sdm")}</span>.
                  </div>
                )}
                <Button onClick={doTerima} className="w-full gap-2" data-testid="button-terima">
                  <CheckCircle2 className="h-4 w-4" /> Terima Pesanan
                </Button>
                {!showTolak ? (
                  <Button variant="outline" className="w-full gap-2" onClick={() => setShowTolak(true)} data-testid="button-toggle-tolak">
                    <XCircle className="h-4 w-4" /> Tolak
                  </Button>
                ) : (
                  <div className="border rounded p-2 space-y-2">
                    <Label className="text-xs">Alasan Penolakan</Label>
                    <Textarea rows={2} value={alasan} onChange={e => setAlasan(e.target.value)} data-testid="input-alasan-tolak" />
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={doTolak} data-testid="button-tolak-confirm">Tolak</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowTolak(false)}>Batal</Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {p.status === "menunggu_sdm" && (
              <div className="text-xs text-muted-foreground">
                Menunggu konfirmasi dari <span className="font-medium">{namaPihak(p, "sdm")}</span>.
              </div>
            )}

            {p.status === "menunggu_ttd" && !myTtd && (
              <Button onClick={doSign} className="w-full" data-testid="button-setuju-sidebar">Setuju Kontrak</Button>
            )}

            {p.status === "kontrak_aktif" && (
              <div className="space-y-2">
                <Label className="text-xs">Tenggat Bayar (hari)</Label>
                <Input type="number" min={1} value={dueDays} onChange={e => setDueDays(Number(e.target.value))} data-testid="input-due-days" />
                <Button onClick={doInvoice} className="w-full gap-2" data-testid="button-terbitkan-invoice">
                  <Receipt className="h-4 w-4" /> Terbitkan Invoice
                </Button>
              </div>
            )}

            {p.status === "lunas" && (
              <Button onClick={doBast} className="w-full gap-2" data-testid="button-finalkan-bast">
                <FileText className="h-4 w-4" /> Finalisasi BAST
              </Button>
            )}

            {["selesai", "ditolak", "batal"].includes(p.status) && (
              <div className="text-xs text-muted-foreground">Pesanan sudah final.</div>
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
