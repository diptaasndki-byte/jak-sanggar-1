import { useState } from "react";
import { useAuth, useDb } from "@/lib/auth";
import { save, fmtDate, logActivity } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { SanggarUser, FotoGaleriItem, Rekening } from "@/lib/types";
import { Lock } from "lucide-react";
import { ProfilePhotoUploader } from "@/components/profile/ProfilePhotoUploader";
import { GaleriUploader } from "@/components/profile/GaleriUploader";
import { RekeningEditor } from "@/components/profile/RekeningEditor";

const MS_MONTH = 30 * 86400000;

export default function SanggarProfile() {
  const { user } = useAuth();
  const db = useDb();
  const { toast } = useToast();
  const [editMode, setEdit] = useState(false);
  if (!user || user.role !== "sanggar") return null;
  const sg = user as SanggarUser;
  const galeri: FotoGaleriItem[] = sg.fotoGaleri ?? [];

  const [draft, setDraft] = useState({
    namaKetua: sg.namaKetua,
    alamat: sg.alamat,
    noHp: sg.noHp ?? "",
    email: sg.email ?? "",
    deskripsi: sg.deskripsi ?? "",
    tahunBerdiri: String(sg.tahunBerdiri ?? ""),
    website: sg.website ?? "",
    instagram: sg.instagram ?? "",
    fotoProfileDataUrl: sg.fotoProfileDataUrl,
    fotoGaleri: galeri,
    rekening: { ...sg.rekening } as Rekening,
  });

  const periodEnded = Date.now() - sg.editPeriodStart > MS_MONTH;
  const effectiveCount = periodEnded ? 0 : sg.editCount;
  const canEdit = effectiveCount < 2;
  const aktif = db.users.filter(u => (u.role === "seniman" || u.role === "pelatih") && (u as any).sanggarId === sg.id && (u as any).status === "aktif").length;

  const submit = () => {
    save(d => {
      const u = d.users.find(x => x.id === sg.id) as SanggarUser | undefined;
      if (!u) return;
      if (Date.now() - u.editPeriodStart > MS_MONTH) { u.editCount = 0; u.editPeriodStart = Date.now(); }
      u.namaKetua = draft.namaKetua;
      u.alamat = draft.alamat;
      u.noHp = draft.noHp;
      u.email = draft.email;
      u.deskripsi = draft.deskripsi || undefined;
      u.tahunBerdiri = draft.tahunBerdiri ? Number(draft.tahunBerdiri) : undefined;
      u.website = draft.website || undefined;
      u.instagram = draft.instagram || undefined;
      u.fotoProfileDataUrl = draft.fotoProfileDataUrl;
      u.fotoGaleri = draft.fotoGaleri;
      u.rekening = draft.rekening;
      u.editCount += 1;
    });
    logActivity(sg.id, "sanggar", "profile-edit");
    setEdit(false);
    toast({ title: "Profil tersimpan" });
  };

  const cancel = () => {
    setDraft({
      namaKetua: sg.namaKetua,
      alamat: sg.alamat,
      noHp: sg.noHp ?? "",
      email: sg.email ?? "",
      deskripsi: sg.deskripsi ?? "",
      tahunBerdiri: String(sg.tahunBerdiri ?? ""),
      website: sg.website ?? "",
      instagram: sg.instagram ?? "",
      fotoProfileDataUrl: sg.fotoProfileDataUrl,
      fotoGaleri: galeri,
      rekening: { ...sg.rekening },
    });
    setEdit(false);
  };

  return (
    <div>
      <PageHeader
        title="Profil Sanggar"
        subtitle="Identitas Sanggar yang sinkron dengan seluruh sistem."
        actions={canEdit && !editMode ? <Button onClick={() => setEdit(true)} data-testid="button-edit">Edit Profil</Button> : null}
      />

      {!canEdit && (
        <div className="mb-4 p-3 rounded-md bg-muted text-sm flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          Tombol Edit dinonaktifkan (sudah digunakan {effectiveCount}× bulan ini). Aktif kembali setelah {fmtDate(sg.editPeriodStart + MS_MONTH)}.
        </div>
      )}

      <Card className="p-6 mb-6">
        <h3 className="font-serif text-lg mb-4">Identitas & Foto Profil</h3>
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
          <ProfilePhotoUploader
            value={editMode ? draft.fotoProfileDataUrl : sg.fotoProfileDataUrl}
            onChange={v => editMode && setDraft({ ...draft, fotoProfileDataUrl: v })}
            fallbackText={sg.namaSanggar}
          />
          <div className="flex-1 grid sm:grid-cols-2 gap-4">
            <Field label="Nama Sanggar" value={sg.namaSanggar} />
            <Field label="Legalitas" value={`${sg.legalitas}${sg.namaBadanHukum ? ` — ${sg.namaBadanHukum}` : ""}`} />
            <Field label="Jenis Kesenian" value={sg.jenisKesenian.join(", ")} />
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Anggota Aktif</Label>
              <div className="flex items-center gap-2"><span className="text-2xl font-serif">{aktif}</span><Badge variant="secondary">otomatis</Badge></div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h3 className="font-serif text-lg mb-4">Data Kontak & Profil Publik</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {editMode ? (
            <>
              <Edit label="Nama Ketua" v={draft.namaKetua} on={v => setDraft({ ...draft, namaKetua: v })} />
              <Edit label="Tahun Berdiri" v={draft.tahunBerdiri} on={v => setDraft({ ...draft, tahunBerdiri: v.replace(/\D/g, "").slice(0, 4) })} />
              <Edit label="Email" v={draft.email} on={v => setDraft({ ...draft, email: v })} />
              <Edit label="No. HP" v={draft.noHp} on={v => setDraft({ ...draft, noHp: v })} />
              <Edit label="Website" v={draft.website} on={v => setDraft({ ...draft, website: v })} />
              <Edit label="Instagram" v={draft.instagram} on={v => setDraft({ ...draft, instagram: v })} />
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Alamat</Label>
                <Textarea rows={2} value={draft.alamat} onChange={e => setDraft({ ...draft, alamat: e.target.value })} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Deskripsi Sanggar</Label>
                <Textarea rows={3} value={draft.deskripsi} onChange={e => setDraft({ ...draft, deskripsi: e.target.value })} placeholder="Sejarah singkat, visi, dan misi sanggar..." />
              </div>
            </>
          ) : (
            <>
              <Field label="Nama Ketua" value={sg.namaKetua} />
              <Field label="Tahun Berdiri" value={sg.tahunBerdiri ? String(sg.tahunBerdiri) : "-"} />
              <Field label="Email" value={sg.email ?? "-"} />
              <Field label="No. HP" value={sg.noHp ?? "-"} />
              <Field label="Website" value={sg.website ?? "-"} />
              <Field label="Instagram" value={sg.instagram ?? "-"} />
              <div className="sm:col-span-2"><Field label="Alamat" value={sg.alamat} /></div>
              <div className="sm:col-span-2"><Field label="Deskripsi Sanggar" value={sg.deskripsi ?? "-"} long /></div>
            </>
          )}
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h3 className="font-serif text-lg mb-4">Rekening Bank Sanggar</h3>
        <RekeningEditor value={editMode ? draft.rekening : sg.rekening} onChange={r => editMode && setDraft({ ...draft, rekening: r })} editable={editMode} />
      </Card>

      <Card className="p-6 mb-6">
        <h3 className="font-serif text-lg mb-4">Galeri Karya & Dokumentasi</h3>
        <GaleriUploader items={editMode ? draft.fotoGaleri : galeri} onChange={items => editMode && setDraft({ ...draft, fotoGaleri: items })} editable={editMode} />
      </Card>

      <Card className="p-4 text-sm text-muted-foreground flex items-center justify-between">
        <span>Edit terpakai bulan ini</span>
        <Badge variant={effectiveCount >= 2 ? "destructive" : "secondary"}>{effectiveCount}/2</Badge>
      </Card>

      {editMode && (
        <div className="mt-6 flex gap-2 justify-end sticky bottom-4">
          <Button variant="outline" onClick={cancel}>Batal</Button>
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
function Edit({ label, v, on }: { label: string; v: string; on: (s: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input value={v} onChange={e => on(e.target.value)} />
    </div>
  );
}
