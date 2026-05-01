import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth, useDb } from "@/lib/auth";
import { save, recomputeSaldo, fmtDate, fmtDateTime, fmtRp, logActivity } from "@/lib/store";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { KasEntry, Latihan, SanggarUser, TransaksiManual } from "@/lib/types";
import { LogIn, RotateCcw, Trash2, Edit, Wallet, GraduationCap, ScrollText, Users, Activity } from "lucide-react";

function fmtIsoLocal(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function EditKasDialog({
  entry,
  onClose,
}: {
  entry: KasEntry | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<KasEntry | null>(entry);
  useEffect(() => { setDraft(entry); }, [entry]);
  if (!entry || !draft) return null;
  const handleSave = () => {
    save((db) => {
      db.kas = db.kas.map((k) => (k.id === draft.id ? { ...draft } : k));
    });
    recomputeSaldo(draft.sanggarId);
    toast({ title: "Entri kas diperbarui" });
    onClose();
  };
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Entri Buku Kas</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Tanggal</Label>
            <Input
              type="date"
              value={fmtIsoLocal(draft.tanggal)}
              onChange={(e) => {
                const d = new Date(e.target.value);
                if (!isNaN(d.getTime())) setDraft({ ...draft, tanggal: d.getTime() });
              }}
              data-testid="input-edit-kas-tanggal"
            />
          </div>
          <div>
            <Label>Keterangan</Label>
            <Input
              value={draft.keterangan}
              onChange={(e) => setDraft({ ...draft, keterangan: e.target.value })}
              data-testid="input-edit-kas-keterangan"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Debit (masuk)</Label>
              <Input
                type="number"
                value={draft.debit}
                onChange={(e) => setDraft({ ...draft, debit: Number(e.target.value) || 0 })}
                data-testid="input-edit-kas-debit"
              />
            </div>
            <div>
              <Label>Kredit (keluar)</Label>
              <Input
                type="number"
                value={draft.kredit}
                onChange={(e) => setDraft({ ...draft, kredit: Number(e.target.value) || 0 })}
                data-testid="input-edit-kas-kredit"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave} data-testid="button-save-edit-kas">Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditLatihanDialog({
  entry,
  onClose,
}: {
  entry: Latihan | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<Latihan | null>(entry);
  useEffect(() => { setDraft(entry); }, [entry]);
  if (!entry || !draft) return null;
  const handleSave = () => {
    save((db) => {
      db.latihan = db.latihan.map((l) => (l.id === draft.id ? { ...draft, editedAt: Date.now() } : l));
    });
    toast({ title: "Latihan diperbarui" });
    onClose();
  };
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Jadwal Latihan</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={draft.tanggal}
                onChange={(e) => setDraft({ ...draft, tanggal: e.target.value })}
              />
            </div>
            <div>
              <Label>Jam</Label>
              <Input
                type="time"
                value={draft.jam}
                onChange={(e) => setDraft({ ...draft, jam: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Tempat</Label>
            <Input value={draft.tempat} onChange={(e) => setDraft({ ...draft, tempat: e.target.value })} />
          </div>
          <div>
            <Label>Kurikulum</Label>
            <Input value={draft.kurikulum} onChange={(e) => setDraft({ ...draft, kurikulum: e.target.value })} />
          </div>
          <div>
            <Label>Ciri Adat</Label>
            <Input value={draft.ciriAdat} onChange={(e) => setDraft({ ...draft, ciriAdat: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function KuratorManajemenData() {
  const db = useDb();
  const { toast } = useToast();
  const { impersonate } = useAuth();
  const [, navigate] = useLocation();
  const sanggarList = useMemo(
    () => db.users.filter((u): u is SanggarUser => u.role === "sanggar"),
    [db.users],
  );
  const [sanggarId, setSanggarId] = useState<string>(sanggarList[0]?.id ?? "");
  const sanggar = sanggarList.find((s) => s.id === sanggarId) ?? null;
  const [editingKas, setEditingKas] = useState<KasEntry | null>(null);
  const [editingLatihan, setEditingLatihan] = useState<Latihan | null>(null);

  if (sanggarList.length === 0) {
    return (
      <div>
        <PageHeader title="Manajemen Data Sanggar" subtitle="Belum ada akun Sanggar terdaftar." />
        <Card className="p-6 text-center text-muted-foreground">
          Tambahkan akun Sanggar dahulu di menu <strong>Pengelolaan Akun</strong>.
        </Card>
      </div>
    );
  }

  const sanggarRoster = db.users.filter(
    (u) => (u.role === "pelatih" || u.role === "seniman") && (u as { sanggarId?: string }).sanggarId === sanggarId,
  );
  const rosterIds = new Set(sanggarRoster.map((u) => u.id));
  const kas = db.kas.filter((k) => k.sanggarId === sanggarId).sort((a, b) => a.tanggal - b.tanggal);
  const transaksi = db.transaksi.filter((t) => t.sanggarId === sanggarId);
  const latihan = db.latihan.filter((l) => l.sanggarId === sanggarId);
  const kurasi = db.kurasiSubmissions.filter((k) => k.sanggarId === sanggarId);
  const pendaftaran = db.pendaftaranPembinaan.filter((p) => p.sanggarId === sanggarId);
  const absensi = db.absensiPembinaan.filter((a) => rosterIds.has(a.pesertaId));
  const regenLogs = db.activity
    .filter((a) => /regener|kurasi|pembinaan/i.test(a.action) && (rosterIds.has(a.actorId) || a.actorId === sanggarId))
    .sort((a, b) => b.ts - a.ts);

  const openLiveSanggar = () => {
    if (!sanggar) return;
    if (impersonate(sanggar.id)) {
      toast({ title: `Masuk sebagai ${sanggar.namaSanggar}`, description: "Gunakan banner emas untuk kembali." });
      navigate("/sanggar");
    }
  };

  const hapusKas = (id: string) => {
    if (!confirm("Hapus entri kas ini?")) return;
    save((d) => { d.kas = d.kas.filter((k) => k.id !== id); });
    if (sanggar) recomputeSaldo(sanggar.id);
    logActivity(sanggar?.id ?? "kurator", "kurator", "kurator-hapus-kas", { kasId: id });
    toast({ title: "Entri kas dihapus" });
  };
  const hapusTransaksi = (id: string) => {
    if (!confirm("Hapus transaksi manual ini? Entri kas terkait juga dihapus.")) return;
    save((d) => {
      d.transaksi = d.transaksi.filter((t) => t.id !== id);
      d.kas = d.kas.filter((k) => !(k.refType === "manual" && k.refId === id));
    });
    if (sanggar) recomputeSaldo(sanggar.id);
    toast({ title: "Transaksi dihapus" });
  };
  const recompute = () => {
    if (!sanggar) return;
    const saldo = recomputeSaldo(sanggar.id);
    toast({ title: "Saldo dihitung ulang", description: `Saldo terbaru: ${fmtRp(saldo)}` });
  };
  const hapusLatihan = (id: string) => {
    if (!confirm("Hapus jadwal latihan ini?")) return;
    save((d) => { d.latihan = d.latihan.filter((l) => l.id !== id); });
    toast({ title: "Latihan dihapus" });
  };
  const hapusKurasi = (id: string) => {
    if (!confirm("Hapus submission kurasi ini?")) return;
    save((d) => { d.kurasiSubmissions = d.kurasiSubmissions.filter((k) => k.id !== id); });
    toast({ title: "Submission kurasi dihapus" });
  };
  const resetFinalized = (id: string) => {
    if (!confirm("Reset semua skor finalized pada submission ini?")) return;
    save((d) => {
      d.kurasiSubmissions = d.kurasiSubmissions.map((k) =>
        k.id === id ? { ...k, finalized: {} } : k,
      );
    });
    toast({ title: "Finalisasi direset" });
  };
  const hapusPendaftaran = (id: string) => {
    if (!confirm("Hapus pendaftaran pembinaan ini?")) return;
    save((d) => { d.pendaftaranPembinaan = d.pendaftaranPembinaan.filter((p) => p.id !== id); });
    toast({ title: "Pendaftaran dihapus" });
  };
  const hapusAbsensi = (id: string) => {
    if (!confirm("Hapus absensi ini?")) return;
    save((d) => { d.absensiPembinaan = d.absensiPembinaan.filter((a) => a.id !== id); });
    toast({ title: "Absensi dihapus" });
  };
  const hapusActivity = (id: string) => {
    if (!confirm("Hapus log aktivitas ini?")) return;
    save((d) => { d.activity = d.activity.filter((a) => a.id !== id); });
    toast({ title: "Log dihapus" });
  };

  const userById = (id: string) => db.users.find((u) => u.id === id);

  return (
    <div>
      <PageHeader
        title="Manajemen Data Sanggar"
        subtitle="Kurator: pantau & sunting Buku Kas, Latihan, Kurasi, Pembinaan, dan Regenerasi sanggar manapun."
      />
      <Card className="p-4 mb-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[240px]">
          <Label>Pilih Sanggar</Label>
          <Select value={sanggarId} onValueChange={setSanggarId}>
            <SelectTrigger data-testid="select-manajemen-sanggar"><SelectValue /></SelectTrigger>
            <SelectContent>
              {sanggarList.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.namaSanggar}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {sanggar && (
          <div className="text-sm text-muted-foreground">
            Saldo kas: <strong className="text-foreground">{fmtRp(sanggar.saldo ?? 0)}</strong>
            {" · "}
            Anggota: <strong className="text-foreground">{sanggarRoster.length}</strong>
          </div>
        )}
        <Button
          variant="outline"
          className="gap-1"
          onClick={openLiveSanggar}
          data-testid="button-buka-sebagai-sanggar"
        >
          <LogIn className="h-4 w-4" />Buka sebagai Sanggar Ini
        </Button>
      </Card>

      <Tabs defaultValue="kas">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="kas" className="gap-1"><Wallet className="h-3.5 w-3.5" />Buku Kas</TabsTrigger>
          <TabsTrigger value="latihan" className="gap-1"><GraduationCap className="h-3.5 w-3.5" />Latihan</TabsTrigger>
          <TabsTrigger value="kurasi" className="gap-1"><ScrollText className="h-3.5 w-3.5" />Kurasi</TabsTrigger>
          <TabsTrigger value="pembinaan" className="gap-1"><Users className="h-3.5 w-3.5" />Pembinaan</TabsTrigger>
          <TabsTrigger value="regenerasi" className="gap-1"><Activity className="h-3.5 w-3.5" />Regenerasi</TabsTrigger>
        </TabsList>

        <TabsContent value="kas" className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              {kas.length} entri kas · {transaksi.length} transaksi manual
            </div>
            <Button size="sm" variant="outline" className="gap-1" onClick={recompute} data-testid="button-recompute-saldo">
              <RotateCcw className="h-3.5 w-3.5" />Recompute Saldo
            </Button>
          </div>
          <Card className="overflow-hidden">
            <div className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground border-b">Entri Buku Kas</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Kredit</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kas.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Belum ada entri kas.</TableCell></TableRow>
                )}
                {kas.map((k) => (
                  <TableRow key={k.id} data-testid={`row-kas-${k.id}`}>
                    <TableCell className="text-xs">{fmtDate(k.tanggal)}</TableCell>
                    <TableCell>{k.keterangan}</TableCell>
                    <TableCell className="text-right text-emerald-700 dark:text-emerald-400">{k.debit ? fmtRp(k.debit) : "-"}</TableCell>
                    <TableCell className="text-right text-rose-700 dark:text-rose-400">{k.kredit ? fmtRp(k.kredit) : "-"}</TableCell>
                    <TableCell className="text-right font-medium">{fmtRp(k.saldo)}</TableCell>
                    <TableCell className="text-xs"><Badge variant="outline">{k.refType}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => setEditingKas(k)} data-testid={`button-edit-kas-${k.id}`}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => hapusKas(k.id)} data-testid={`button-hapus-kas-${k.id}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <Card className="overflow-hidden">
            <div className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground border-b">Transaksi Manual</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transaksi.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Belum ada transaksi manual.</TableCell></TableRow>
                )}
                {transaksi.map((t: TransaksiManual) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs">{t.tanggal}</TableCell>
                    <TableCell><Badge variant={t.jenis === "pemasukan" ? "default" : "destructive"}>{t.jenis}</Badge></TableCell>
                    <TableCell className="text-xs">{t.kategori}</TableCell>
                    <TableCell className="text-right">{fmtRp(t.nominal)}</TableCell>
                    <TableCell className="text-xs">{t.keterangan}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="destructive" onClick={() => hapusTransaksi(t.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="latihan" className="mt-4">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jam</TableHead>
                  <TableHead>Tempat</TableHead>
                  <TableHead>Kurikulum</TableHead>
                  <TableHead>Pelatih</TableHead>
                  <TableHead>Laporan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latihan.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Belum ada latihan.</TableCell></TableRow>
                )}
                {latihan.map((l) => {
                  const pelatih = l.pelatihId ? userById(l.pelatihId) : null;
                  return (
                    <TableRow key={l.id} data-testid={`row-latihan-${l.id}`}>
                      <TableCell className="text-xs">{l.tanggal}</TableCell>
                      <TableCell className="text-xs">{l.jam}</TableCell>
                      <TableCell>{l.tempat}</TableCell>
                      <TableCell className="text-xs">{l.kurikulum}</TableCell>
                      <TableCell className="text-xs">{pelatih ? (pelatih as { nama?: string }).nama ?? pelatih.username : "-"}</TableCell>
                      <TableCell>{l.laporan ? <Badge>Ada</Badge> : <Badge variant="outline">-</Badge>}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => setEditingLatihan(l)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => hapusLatihan(l.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="kurasi" className="mt-4">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dibuat</TableHead>
                  <TableHead>Tahap 1 fields</TableHead>
                  <TableHead>Video Tahap 2</TableHead>
                  <TableHead>Juri Skor</TableHead>
                  <TableHead>Finalized</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kurasi.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Belum ada submission kurasi.</TableCell></TableRow>
                )}
                {kurasi.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="text-xs">{fmtDate(k.createdAt)}</TableCell>
                    <TableCell className="text-xs">{Object.keys(k.tahap1).length}</TableCell>
                    <TableCell className="text-xs">{k.tahap2VideoName ?? "-"}</TableCell>
                    <TableCell className="text-xs">{Object.keys(k.scores).length}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant={Object.keys(k.finalized).length > 0 ? "default" : "outline"}>
                        {Object.keys(k.finalized).length} juri
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => resetFinalized(k.id)}>
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => hapusKurasi(k.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="pembinaan" className="mt-4 space-y-4">
          <Card className="overflow-hidden">
            <div className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground border-b">Pendaftaran Pembinaan</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dibuat</TableHead>
                  <TableHead>Delegasi</TableHead>
                  <TableHead>Setuju</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendaftaran.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Belum ada pendaftaran.</TableCell></TableRow>
                )}
                {pendaftaran.map((p) => {
                  const del = userById(p.delegasiId);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">{fmtDate(p.createdAt)}</TableCell>
                      <TableCell>{del ? (del as { nama?: string }).nama ?? del.username : p.delegasiId}</TableCell>
                      <TableCell>{p.setuju ? <Badge>Ya</Badge> : <Badge variant="outline">Tidak</Badge>}</TableCell>
                      <TableCell className="text-xs font-mono">{p.barcode}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="destructive" onClick={() => hapusPendaftaran(p.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
          <Card className="overflow-hidden">
            <div className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground border-b">Absensi (anggota sanggar ini)</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Peserta</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Validasi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {absensi.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Belum ada absensi.</TableCell></TableRow>
                )}
                {absensi.map((a) => {
                  const peserta = userById(a.pesertaId);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs">{fmtDateTime(a.ts)}</TableCell>
                      <TableCell>{peserta ? (peserta as { nama?: string }).nama ?? peserta.username : a.pesertaId}</TableCell>
                      <TableCell><Badge variant="outline">{a.slot}</Badge></TableCell>
                      <TableCell>{a.validatedByAdminId ? <Badge>Tervalidasi</Badge> : <Badge variant="outline">Pending</Badge>}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="destructive" onClick={() => hapusAbsensi(a.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="regenerasi" className="mt-4">
          <Card className="overflow-hidden">
            <div className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground border-b">
              Aktivitas Regenerasi/Kurasi/Pembinaan ({regenLogs.length})
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Aktor</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Meta</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regenLogs.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Belum ada log relevan.</TableCell></TableRow>
                )}
                {regenLogs.slice(0, 100).map((a) => {
                  const actor = userById(a.actorId);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs">{fmtDateTime(a.ts)}</TableCell>
                      <TableCell className="text-xs">{actor ? (actor as { nama?: string; namaSanggar?: string }).namaSanggar ?? (actor as { nama?: string }).nama ?? actor.username : a.actorId}</TableCell>
                      <TableCell className="text-xs"><Badge variant="outline">{a.action}</Badge></TableCell>
                      <TableCell className="text-xs max-w-[280px] truncate">
                        {a.meta ? <code className="text-[11px]">{JSON.stringify(a.meta)}</code> : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="destructive" onClick={() => hapusActivity(a.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <EditKasDialog entry={editingKas} onClose={() => setEditingKas(null)} />
      <EditLatihanDialog entry={editingLatihan} onClose={() => setEditingLatihan(null)} />
    </div>
  );
}
