import { useState } from "react";
import { useAuth, useDb } from "@/lib/auth";
import { save, logActivity, load as loadDb } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { SanggarUser, FotoGaleriItem, Rekening } from "@/lib/types";
import { Download } from "lucide-react";
import { ProfilePhotoUploader } from "@/components/profile/ProfilePhotoUploader";
import { GaleriUploader } from "@/components/profile/GaleriUploader";
import { RekeningEditor } from "@/components/profile/RekeningEditor";
import { downloadLockedPdf } from "@/lib/pdf";

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
    npwp: sg.npwp ?? "",
    fotoProfileDataUrl: sg.fotoProfileDataUrl,
    fotoGaleri: galeri,
    rekening: { ...sg.rekening } as Rekening,
  });

  const aktif = db.users.filter(u => (u.role === "seniman" || u.role === "pelatih") && (u as any).sanggarId === sg.id && (u as any).status === "aktif").length;

  const submit = () => {
    save(d => {
      const u = d.users.find(x => x.id === sg.id) as SanggarUser | undefined;
      if (!u) return;
      u.namaKetua = draft.namaKetua;
      u.alamat = draft.alamat;
      u.noHp = draft.noHp;
      u.email = draft.email;
      u.deskripsi = draft.deskripsi || undefined;
      u.tahunBerdiri = draft.tahunBerdiri ? Number(draft.tahunBerdiri) : undefined;
      u.website = draft.website || undefined;
      u.instagram = draft.instagram || undefined;
      u.npwp = draft.npwp.trim() || undefined;
      u.fotoProfileDataUrl = draft.fotoProfileDataUrl;
      u.fotoGaleri = draft.fotoGaleri;
      u.rekening = draft.rekening;
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
      npwp: sg.npwp ?? "",
      fotoProfileDataUrl: sg.fotoProfileDataUrl,
      fotoGaleri: galeri,
      rekening: { ...sg.rekening },
    });
    setEdit(false);
  };

  const downloadPdf = () => {
    const ownerPwd = loadDb().exportPassword || "kurator123";
    const safeName = sg.namaSanggar.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_");
    downloadLockedPdf({
      filename: `Profil_${safeName || "Sanggar"}.pdf`,
      title: `Profil Sanggar — ${sg.namaSanggar}`,
      subtitle: `Dicetak ${new Date().toLocaleString("id-ID")} · Jak Sanggar`,
      ownerPassword: ownerPwd,
      sections: [
        { heading: "Identitas Sanggar", body:
            `Nama Sanggar: ${sg.namaSanggar}\n` +
            `Nama Ketua: ${sg.namaKetua}\n` +
            `Legalitas: ${sg.legalitas}${sg.namaBadanHukum ? ` — ${sg.namaBadanHukum}` : ""}\n` +
            `Tahun Berdiri: ${sg.tahunBerdiri ?? "-"}\n` +
            `Jenis Kesenian: ${sg.jenisKesenian.join(", ")}\n` +
            `Anggota Aktif: ${aktif} orang\n` +
            `NPWP: ${sg.npwp ?? "-"}` },
        { heading: "Kontak & Profil Publik", body:
            `Email: ${sg.email ?? "-"}\n` +
            `No. HP: ${sg.noHp ?? "-"}\n` +
            `Website: ${sg.website ?? "-"}\n` +
            `Instagram: ${sg.instagram ?? "-"}\n` +
            `Alamat: ${sg.alamat}` },
        ...(sg.deskripsi ? [{ heading: "Deskripsi Sanggar", body: sg.deskripsi }] : []),
        { heading: "Rekening Bank", body:
            `Bank: ${sg.rekening.bank}\n` +
            `No. Rekening: ${sg.rekening.nomor}\n` +
            `Atas Nama: ${sg.rekening.atasNama}` },
      ],
    });
    toast({ title: "PDF profil diunduh" });
  };

  return (
    <div>
      <PageHeader
        title="Profil Sanggar"
        subtitle="Identitas Sanggar yang sinkron dengan seluruh sistem."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadPdf} data-testid="button-download-pdf">
              <Download className="h-4 w-4 mr-1" /> Unduh PDF
            </Button>
            {!editMode && (
              <Button onClick={() => setEdit(true)} data-testid="button-edit">Edit Profil</Button>
            )}
          </div>
        }
      />

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
              <Edit label="NPWP" v={draft.npwp} on={v => setDraft({ ...draft, npwp: v.replace(/[^\d.\-]/g, "").slice(0, 25) })} />
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
              <Field label="NPWP" value={sg.npwp ?? "-"} />
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
