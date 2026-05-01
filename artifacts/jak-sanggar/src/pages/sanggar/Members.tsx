import { useState } from "react";
import { useAuth, useDb } from "@/lib/auth";
import { save, logActivity, uid } from "@/lib/store";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SanggarUser, PelatihUser, SenimanUser, JenisKesenian, Bank } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Check, X, ArrowRightLeft, Star, FileUp } from "lucide-react";

export default function Members() {
  const { user } = useAuth();
  const db = useDb();
  const { toast } = useToast();
  if (!user || user.role !== "sanggar") return null;
  const sg = user as SanggarUser;
  const list = db.users.filter(u => (u.role === "seniman" || u.role === "pelatih") && (u as any).sanggarId === sg.id) as (PelatihUser | SenimanUser)[];

  const aktif = list.filter(u => u.status === "aktif");
  const pending = list.filter(u => u.status === "pending");
  const arsip = list.filter(u => u.status === "keluar" || u.status === "ditolak");

  const approve = (id: string) => {
    save(d => { const u = d.users.find(x => x.id === id) as any; if (u) u.status = "aktif"; });
    logActivity(sg.id, "sanggar", "approve-member", { id });
    toast({ title: "Anggota diterima" });
  };
  const reject = (id: string) => {
    save(d => { const u = d.users.find(x => x.id === id) as any; if (u) u.status = "ditolak"; });
    toast({ title: "Permohonan ditolak" });
  };
  const promote = (id: string) => {
    save(d => {
      const u = d.users.find(x => x.id === id) as any;
      if (u && u.role === "seniman") {
        u.role = "pelatih";
        u.honorPerSesi = d.honorPerSesiDefault;
      }
    });
    logActivity(sg.id, "sanggar", "promote-pelatih", { id });
    toast({ title: "Promosi peran berhasil", description: "Seniman dipromosikan menjadi Pelatih." });
  };
  const mutasi = (id: string, newSanggarId: string) => {
    save(d => { const u = d.users.find(x => x.id === id) as any; if (u) u.sanggarId = newSanggarId; });
    toast({ title: "Mutasi tercatat" });
  };
  const dismiss = (id: string, fileName: string) => {
    save(d => {
      const u = d.users.find(x => x.id === id) as any;
      if (u) u.status = "keluar";
      d.activity.unshift({ id: uid(), actorId: sg.id, actorRole: "sanggar", action: "dismiss-member", meta: { id, fileName }, ts: Date.now() });
    });
    toast({ title: "Anggota diberhentikan", description: `Surat keterangan: ${fileName}` });
  };

  return (
    <div>
      <PageHeader title="Keanggotaan & Regenerasi" subtitle="Kelola anggota, permohonan gabung, mutasi, promosi, dan pemberhentian." actions={<DirectAddDialog sg={sg} />} />
      <Tabs defaultValue="aktif">
        <TabsList>
          <TabsTrigger value="aktif">Anggota Aktif ({aktif.length})</TabsTrigger>
          <TabsTrigger value="pending">Permohonan Gabung ({pending.length})</TabsTrigger>
          <TabsTrigger value="arsip">Arsip ({arsip.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="aktif">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nama</TableHead><TableHead>Peran</TableHead><TableHead>Usia</TableHead><TableHead>Pendidikan</TableHead><TableHead>Profesi/Kesenian</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {aktif.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada anggota aktif.</TableCell></TableRow>}
                {aktif.map(m => (
                  <TableRow key={m.id} data-testid={`row-member-${m.id}`}>
                    <TableCell className="font-medium">{m.nama}</TableCell>
                    <TableCell><Badge variant="outline">{m.role}</Badge></TableCell>
                    <TableCell>{m.usia}</TableCell>
                    <TableCell>{m.pendidikan}</TableCell>
                    <TableCell className="text-sm">{(m as SenimanUser).profesi ?? m.jenisKesenian}</TableCell>
                    <TableCell><Badge>{m.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <MutasiDialog member={m} onSubmit={(s) => mutasi(m.id, s)} />
                        {m.role === "seniman" && <Button size="sm" variant="outline" className="gap-1" onClick={() => promote(m.id)}><Star className="h-3.5 w-3.5" />Promosi</Button>}
                        <DismissDialog memberName={m.nama} onSubmit={(f) => dismiss(m.id, f)} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="pending">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Peran</TableHead><TableHead>Kontak</TableHead><TableHead>Kesenian</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
              <TableBody>
                {pending.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Tidak ada permohonan baru.</TableCell></TableRow>}
                {pending.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.nama}</TableCell>
                    <TableCell><Badge variant="outline">{m.role}</Badge></TableCell>
                    <TableCell className="text-sm">{m.noHp}</TableCell>
                    <TableCell>{m.jenisKesenian}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="gap-1 mr-2" onClick={() => reject(m.id)}><X className="h-3.5 w-3.5" />Tolak</Button>
                      <Button size="sm" className="gap-1" onClick={() => approve(m.id)}><Check className="h-3.5 w-3.5" />Terima</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="arsip">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Peran Terakhir</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {arsip.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Arsip kosong.</TableCell></TableRow>}
                {arsip.map(m => (
                  <TableRow key={m.id}><TableCell>{m.nama}</TableCell><TableCell>{m.role}</TableCell><TableCell><Badge variant="secondary">{m.status}</Badge></TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MutasiDialog({ member, onSubmit }: { member: PelatihUser | SenimanUser; onSubmit: (sanggarId: string) => void }) {
  const db = useDb();
  const [open, setOpen] = useState(false);
  const others = (db.users.filter(u => u.role === "sanggar") as SanggarUser[]).filter(s => s.id !== member.sanggarId);
  const [target, setTarget] = useState(others[0]?.id ?? "");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline" className="gap-1"><ArrowRightLeft className="h-3.5 w-3.5" />Mutasi</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Mutasi Anggota</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">Pindahkan <span className="font-medium text-foreground">{member.nama}</span> ke sanggar lain.</div>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{others.map(s => <SelectItem key={s.id} value={s.id}>{s.namaSanggar}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={() => { onSubmit(target); setOpen(false); }}>Catat Mutasi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DismissDialog({ memberName, onSubmit }: { memberName: string; onSubmit: (filename: string) => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="destructive" className="gap-1"><FileUp className="h-3.5 w-3.5" />Berhentikan</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Pemberhentian Anggota</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">Unggah Surat Keterangan (PDF) untuk memberhentikan <span className="font-medium text-foreground">{memberName}</span>.</div>
          <Input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button variant="destructive" disabled={!file} onClick={() => { if (file) { onSubmit(file.name); setOpen(false); } }}>Konfirmasi Pemberhentian</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DirectAddDialog({ sg }: { sg: SanggarUser }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ nama: "", username: "", password: "", noHp: "", usia: 20, pendidikan: "SMA", role: "seniman" as "seniman" | "pelatih", jenisKesenian: "Tari" as JenisKesenian });
  const { toast } = useToast();
  const submit = () => {
    const base = {
      id: uid(), username: f.username, password: f.password, noHp: f.noHp,
      nama: f.nama, usia: f.usia, pendidikan: f.pendidikan, jenisKesenian: f.jenisKesenian,
      sanggarId: sg.id, status: "aktif" as const,
      rekening: { bank: "BCA" as Bank, nomor: "-", atasNama: f.nama },
      createdAt: Date.now(),
    };
    const newU = f.role === "pelatih" ? ({ ...base, role: "pelatih", honorPerSesi: 250000 } as PelatihUser) : ({ ...base, role: "seniman" } as SenimanUser);
    save(d => { d.users.push(newU); });
    logActivity(sg.id, "sanggar", "create-member-direct", { id: newU.id });
    toast({ title: "Akun dibuat" });
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="gap-2" data-testid="button-add-member"><UserPlus className="h-4 w-4" />Buat Akun Anggota</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Buat Akun Anggota Langsung</DialogTitle></DialogHeader>
        <div className="grid sm:grid-cols-2 gap-3">
          <I l="Nama" v={f.nama} on={v => setF({ ...f, nama: v })} />
          <I l="Username" v={f.username} on={v => setF({ ...f, username: v })} />
          <I l="Password" v={f.password} on={v => setF({ ...f, password: v })} type="password" />
          <I l="No. HP" v={f.noHp} on={v => setF({ ...f, noHp: v })} />
          <I l="Usia" v={String(f.usia)} on={v => setF({ ...f, usia: Number(v) })} type="number" />
          <I l="Pendidikan" v={f.pendidikan} on={v => setF({ ...f, pendidikan: v })} />
          <div className="space-y-1.5"><Label>Peran</Label>
            <Select value={f.role} onValueChange={(v: any) => setF({ ...f, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="seniman">Seniman</SelectItem><SelectItem value="pelatih">Pelatih</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Jenis Kesenian</Label>
            <Select value={f.jenisKesenian} onValueChange={(v: JenisKesenian) => setF({ ...f, jenisKesenian: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(["Tari", "Musik", "Teater", "Rupa", "Sastra", "Silat"] as JenisKesenian[]).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={submit} disabled={!f.nama || !f.username || !f.password}>Buat Akun</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function I({ l, v, on, type = "text" }: { l: string; v: string; on: (s: string) => void; type?: string }) {
  return <div className="space-y-1.5"><Label>{l}</Label><Input type={type} value={v} onChange={e => on(e.target.value)} /></div>;
}
