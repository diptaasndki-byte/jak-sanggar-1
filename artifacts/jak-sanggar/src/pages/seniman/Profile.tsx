import { useState } from "react";
import { useAuth, useDb } from "@/lib/auth";
import { save, logActivity } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { SenimanUser, JenisKesenian, FotoGaleriItem, Rekening } from "@/lib/types";
import { ProfilePhotoUploader } from "@/components/profile/ProfilePhotoUploader";
import { GaleriUploader } from "@/components/profile/GaleriUploader";
import { RekeningEditor } from "@/components/profile/RekeningEditor";

const KESENIAN: JenisKesenian[] = ["Tari", "Musik", "Teater", "Rupa", "Sastra"];

export default function SenimanProfile() {
  const { user } = useAuth();
  const db = useDb();
  const { toast } = useToast();
  const [editMode, setEdit] = useState(false);
  if (!user || user.role !== "seniman") return null;
  const s = user as SenimanUser;
  const sanggar = db.users.find(u => u.id === s.sanggarId);
  const galeri: FotoGaleriItem[] = s.fotoGaleri ?? [];

  const [draft, setDraft] = useState({
    nama: s.nama,
    usia: String(s.usia ?? ""),
    pendidikan: s.pendidikan,
    profesi: s.profesi ?? "",
    jenisKesenian: s.jenisKesenian,
    email: s.email ?? "",
    noHp: s.noHp ?? "",
    bio: s.bio ?? "",
    alamat: s.alamat ?? "",
    jenisKelamin: s.jenisKelamin ?? "",
    tanggalLahir: s.tanggalLahir ?? "",
    fotoProfileDataUrl: s.fotoProfileDataUrl,
    fotoGaleri: galeri,
    rekening: { ...s.rekening } as Rekening,
  });

  const submit = () => {
    save(d => {
      const u = d.users.find(x => x.id === s.id) as SenimanUser | undefined;
      if (!u) return;
      u.nama = draft.nama;
      u.usia = Number(draft.usia) || u.usia;
      u.pendidikan = draft.pendidikan;
      u.profesi = draft.profesi || undefined;
      u.jenisKesenian = draft.jenisKesenian as JenisKesenian;
      u.email = draft.email || undefined;
      u.noHp = draft.noHp || undefined;
      u.bio = draft.bio || undefined;
      u.alamat = draft.alamat || undefined;
      u.jenisKelamin = (draft.jenisKelamin as any) || undefined;
      u.tanggalLahir = draft.tanggalLahir || undefined;
      u.fotoProfileDataUrl = draft.fotoProfileDataUrl;
      u.fotoGaleri = draft.fotoGaleri;
      u.rekening = draft.rekening;
    });
    logActivity(s.id, "seniman", "profile-edit");
    toast({ title: "Profil tersimpan" });
    setEdit(false);
  };

  return (
    <div>
      <PageHeader
        title="Profil Saya"
        subtitle="Lengkapi data identitas, kontak, rekening, dan galeri karya."
        actions={!editMode ? <Button onClick={() => setEdit(true)}>Edit Profil</Button> : null}
      />

      <Card className="p-6 mb-6">
        <h3 className="font-serif text-lg mb-4">Foto & Identitas</h3>
        <div className="flex flex-col lg:flex-row gap-6">
          <ProfilePhotoUploader
            value={editMode ? draft.fotoProfileDataUrl : s.fotoProfileDataUrl}
            onChange={v => editMode && setDraft({ ...draft, fotoProfileDataUrl: v })}
            fallbackText={s.nama}
          />
          <div className="flex-1 grid sm:grid-cols-2 gap-4">
            {editMode ? (
              <>
                <FieldEdit label="Nama Lengkap" v={draft.nama} on={v => setDraft({ ...draft, nama: v })} />
                <FieldEdit label="Usia" v={draft.usia} on={v => setDraft({ ...draft, usia: v.replace(/\D/g, "").slice(0, 3) })} />
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Jenis Kelamin</Label>
                  <Select value={draft.jenisKelamin} onValueChange={v => setDraft({ ...draft, jenisKelamin: v })}>
                    <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                    <SelectContent><SelectItem value="Laki-laki">Laki-laki</SelectItem><SelectItem value="Perempuan">Perempuan</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tanggal Lahir</Label>
                  <Input type="date" value={draft.tanggalLahir} onChange={e => setDraft({ ...draft, tanggalLahir: e.target.value })} />
                </div>
                <FieldEdit label="Pendidikan Terakhir" v={draft.pendidikan} on={v => setDraft({ ...draft, pendidikan: v })} />
                <FieldEdit label="Profesi" v={draft.profesi} on={v => setDraft({ ...draft, profesi: v })} />
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Jenis Kesenian</Label>
                  <Select value={draft.jenisKesenian} onValueChange={v => setDraft({ ...draft, jenisKesenian: v as JenisKesenian })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{KESENIAN.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Sanggar</Label>
                  <div className="text-sm">{(sanggar as any)?.namaSanggar ?? "—"} <Badge variant="outline" className="ml-1">{s.status}</Badge></div>
                </div>
              </>
            ) : (
              <>
                <Field label="Nama Lengkap" value={s.nama} />
                <Field label="Usia" value={String(s.usia)} />
                <Field label="Jenis Kelamin" value={s.jenisKelamin ?? "-"} />
                <Field label="Tanggal Lahir" value={s.tanggalLahir ?? "-"} />
                <Field label="Pendidikan Terakhir" value={s.pendidikan} />
                <Field label="Profesi" value={s.profesi ?? "-"} />
                <Field label="Jenis Kesenian" value={s.jenisKesenian} />
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Sanggar</Label>
                  <div className="text-sm">{(sanggar as any)?.namaSanggar ?? "—"} <Badge variant="outline" className="ml-1">{s.status}</Badge></div>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h3 className="font-serif text-lg mb-4">Kontak & Bio</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {editMode ? (
            <>
              <FieldEdit label="Email" v={draft.email} on={v => setDraft({ ...draft, email: v })} />
              <FieldEdit label="No. HP" v={draft.noHp} on={v => setDraft({ ...draft, noHp: v })} />
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Alamat</Label>
                <Textarea rows={2} value={draft.alamat} onChange={e => setDraft({ ...draft, alamat: e.target.value })} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bio Singkat</Label>
                <Textarea rows={3} value={draft.bio} onChange={e => setDraft({ ...draft, bio: e.target.value })} placeholder="Pengalaman dan minat di bidang kesenian..." />
              </div>
            </>
          ) : (
            <>
              <Field label="Email" value={s.email ?? "-"} />
              <Field label="No. HP" value={s.noHp ?? "-"} />
              <div className="sm:col-span-2"><Field label="Alamat" value={s.alamat ?? "-"} long /></div>
              <div className="sm:col-span-2"><Field label="Bio Singkat" value={s.bio ?? "-"} long /></div>
            </>
          )}
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h3 className="font-serif text-lg mb-4">Rekening Bank Pribadi</h3>
        <p className="text-xs text-muted-foreground mb-4">Digunakan untuk menerima honor proyek/bagi hasil dari sanggar.</p>
        <RekeningEditor value={editMode ? draft.rekening : s.rekening} onChange={r => editMode && setDraft({ ...draft, rekening: r })} editable={editMode} />
      </Card>

      <Card className="p-6 mb-6">
        <h3 className="font-serif text-lg mb-4">Galeri Karya</h3>
        <GaleriUploader items={editMode ? draft.fotoGaleri : galeri} onChange={items => editMode && setDraft({ ...draft, fotoGaleri: items })} editable={editMode} />
      </Card>

      {editMode && (
        <div className="mt-6 flex gap-2 justify-end sticky bottom-4">
          <Button variant="outline" onClick={() => setEdit(false)}>Batal</Button>
          <Button onClick={submit}>Simpan Perubahan</Button>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, long }: { label: string; value: string; long?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className={`text-sm ${long ? "whitespace-pre-wrap" : ""}`}>{value}</div>
    </div>
  );
}
function FieldEdit({ label, v, on }: { label: string; v: string; on: (s: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input value={v} onChange={e => on(e.target.value)} />
    </div>
  );
}
