import React, { useState } from "react";
import { useAuth, useDb } from "@/lib/auth";
import { save, uid, fmtDateTime, logActivity } from "@/lib/store";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { SanggarUser, PelatihUser, SenimanUser } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Award, ScanLine } from "lucide-react";

const SERTIFIKASI_OPTS = ["Sertifikasi Pelatih Tari", "Sertifikasi Manajemen Sanggar", "Sertifikasi Pemain Musik Tradisional", "Sertifikasi Sutradara Teater"];

export default function Pembinaan() {
  const { user } = useAuth();
  const db = useDb();
  const { toast } = useToast();
  if (!user || user.role !== "sanggar") return null;
  const sg = user as SanggarUser;

  const members = db.users.filter(u => (u.role === "seniman" || u.role === "pelatih") && (u as any).sanggarId === sg.id && (u as any).status === "aktif") as (PelatihUser | SenimanUser)[];
  const myReg = db.pendaftaranPembinaan.find(p => p.sanggarId === sg.id);
  const [delegasi, setDelegasi] = useState(members[0]?.id ?? "");
  const [setuju, setSetuju] = useState(false);
  const [sertif, setSertif] = useState(SERTIFIKASI_OPTS[0]);

  const daftar = () => {
    if (!setuju) { toast({ title: "Anda harus menyetujui pernyataan hukum", variant: "destructive" }); return; }
    save(d => {
      d.pendaftaranPembinaan.push({ id: uid(), sanggarId: sg.id, delegasiId: delegasi, setuju: true, barcode: `JS-${sg.id.slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`, createdAt: Date.now() });
    });
    logActivity(sg.id, "sanggar", "register-pembinaan");
    toast({ title: "Pendaftaran pembinaan tersimpan" });
  };

  const issueCert = () => {
    const m = members.find(x => x.id === delegasi);
    if (!m) return;
    save(d => {
      d.sertifikat.push({ id: uid(), pemilikId: m.id, pemilikNama: m.nama, jenis: sertif, sanggarId: sg.id, issuedAt: Date.now() });
    });
    toast({ title: "Sertifikat diterbitkan", description: `${sertif} untuk ${m.nama}` });
  };

  const delegasiUser = members.find(m => m.id === myReg?.delegasiId);
  const absen = db.absensiPembinaan.filter(a => a.pesertaId === myReg?.delegasiId);

  return (
    <div>
      <PageHeader title="Pembinaan Manajemen Sanggar" subtitle="Pendaftaran, kartu registrasi, absensi, dan sertifikasi profesi." />

      {!myReg ? (
        <Card className="p-6 max-w-2xl">
          <h3 className="font-serif text-xl">Registrasi Pembinaan</h3>
          <p className="text-sm text-muted-foreground mt-1">Tunjuk satu delegasi sanggar untuk mengikuti program pembinaan.</p>
          <div className="mt-5 space-y-4">
            <div className="space-y-1.5"><Label>Delegasi</Label>
              <Select value={delegasi} onValueChange={setDelegasi}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.nama} — {m.role}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <label className="flex items-start gap-3 text-sm border rounded-md p-3">
              <Checkbox checked={setuju} onCheckedChange={(c) => setSetuju(!!c)} />
              <span>Saya, atas nama Sanggar, menyetujui pernyataan hukum bahwa data yang diberikan benar dan bersedia mengikuti seluruh tahapan pembinaan sesuai ketentuan Pemerintah Provinsi DKI Jakarta.</span>
            </label>
            <Button onClick={daftar}>Daftarkan Sanggar</Button>
          </div>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground relative overflow-hidden">
            <div className="absolute inset-0 batik-pattern opacity-30" />
            <div className="relative">
              <div className="text-xs uppercase tracking-wider opacity-75">Kartu Registrasi Pembinaan</div>
              <div className="font-serif text-2xl mt-1">{sg.namaSanggar}</div>
              <div className="text-sm opacity-90 mt-0.5">Delegasi: {delegasiUser?.nama ?? "-"}</div>
              <div className="text-xs opacity-75 mt-0.5">{delegasiUser?.role} · {delegasiUser?.jenisKesenian}</div>
              <div className="mt-6 bg-white p-3 rounded-md inline-block">
                <Barcode value={myReg.barcode} />
                <div className="text-[10px] text-center text-foreground/80 mt-1 font-mono">{myReg.barcode}</div>
              </div>
              <div className="mt-4 text-xs opacity-80">Terdaftar: {fmtDateTime(myReg.createdAt)}</div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-serif text-lg flex items-center gap-2"><ScanLine className="h-5 w-5" /> Sistem Absensi</h3>
            <div className="text-xs text-muted-foreground mt-1">Jam atur Kurator — Pagi maks {db.jamPembinaan.pagiMax}, Siang {db.jamPembinaan.siangStart}-{db.jamPembinaan.siangEnd}, Pulang {db.jamPembinaan.pulangStart}-{db.jamPembinaan.pulangEnd}</div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(["pagi", "siang", "pulang"] as const).map(slot => (
                <Button key={slot} variant="outline" onClick={() => {
                  save(d => { d.absensiPembinaan.push({ id: uid(), pesertaId: myReg.delegasiId, slot, ts: Date.now() }); });
                  toast({ title: `Foto GPS terkirim — menunggu validasi panitia (${slot})` });
                }}>{slot.toUpperCase()}</Button>
              ))}
            </div>
            <div className="mt-4 space-y-1 text-xs">
              {absen.length === 0 && <div className="text-muted-foreground">Belum ada absensi.</div>}
              {absen.map(a => (
                <div key={a.id} className="flex items-center justify-between border-b py-1.5">
                  <span><Badge variant="outline" className="mr-2">{a.slot}</Badge>{fmtDateTime(a.ts)}</span>
                  <Badge variant={a.validatedByAdminId ? "default" : "secondary"}>{a.validatedByAdminId ? "Tervalidasi" : "Menunggu"}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <h3 className="font-serif text-lg flex items-center gap-2"><Award className="h-5 w-5" /> Sertifikasi Profesi</h3>
            <div className="text-sm text-muted-foreground mt-1">Pilih anggota dan jenis sertifikasi (panel-panel diperbarui Kurator, terisi otomatis).</div>
            <div className="mt-4 grid sm:grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Anggota</Label>
                <Select value={delegasi} onValueChange={setDelegasi}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.nama}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Jenis Sertifikasi</Label>
                <Select value={sertif} onValueChange={setSertif}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SERTIFIKASI_OPTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-end"><Button onClick={issueCert} className="w-full">Terbitkan Sertifikat</Button></div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function Barcode({ value }: { value: string }) {
  // Pseudo barcode: deterministic stripe widths from char codes
  const bars: number[] = [];
  for (let i = 0; i < value.length; i++) bars.push(((value.charCodeAt(i) % 4) + 1));
  return (
    <svg width="220" height="50" viewBox="0 0 220 50" xmlns="http://www.w3.org/2000/svg">
      {bars.reduce<{ x: number; nodes: React.ReactNode[] }>((acc, w, i) => {
        const fill = i % 2 === 0 ? "#1a1a1a" : "#ffffff";
        const node = <rect key={i} x={acc.x} y="0" width={w * 2} height="50" fill={fill} />;
        return { x: acc.x + w * 2, nodes: [...acc.nodes, node] };
      }, { x: 0, nodes: [] }).nodes}
    </svg>
  );
}
