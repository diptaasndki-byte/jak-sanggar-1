import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { save, logActivity, load as loadDb } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/hooks/use-toast";
import type { JuriUser, Rekening, FotoGaleriItem } from "@/lib/types";
import { Download } from "lucide-react";
import { ProfilePhotoUploader } from "@/components/profile/ProfilePhotoUploader";
import { GaleriUploader } from "@/components/profile/GaleriUploader";
import { RekeningEditor } from "@/components/profile/RekeningEditor";
import { downloadLockedPdf } from "@/lib/pdf";

const DEFAULT_REK: Rekening = { bank: "BCA", nomor: "", atasNama: "" };

export default function JuriProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editMode, setEdit] = useState(false);
  if (!user || user.role !== "juri") return null;
  const j = user as JuriUser;
  const galeri: FotoGaleriItem[] = j.fotoGaleri ?? [];

  const [draft, setDraft] = useState({
    nama: j.nama,
    keahlian: j.keahlian,
    pendidikan: j.pendidikan ?? "",
    pengalaman: j.pengalaman ?? "",
    bio: j.bio ?? "",
    alamat: j.alamat ?? "",
    email: j.email ?? "",
    noHp: j.noHp ?? "",
    npwp: j.npwp ?? "",
    fotoProfileDataUrl: j.fotoProfileDataUrl,
    fotoGaleri: galeri,
    rekening: { ...(j.rekening ?? DEFAULT_REK) } as Rekening,
  });

  const submit = () => {
    save(d => {
      const u = d.users.find(x => x.id === j.id) as JuriUser | undefined;
      if (!u) return;
      u.nama = draft.nama;
      u.keahlian = draft.keahlian;
      u.pendidikan = draft.pendidikan || undefined;
      u.pengalaman = draft.pengalaman || undefined;
      u.bio = draft.bio || undefined;
      u.alamat = draft.alamat || undefined;
      u.email = draft.email || undefined;
      u.noHp = draft.noHp || undefined;
      u.npwp = draft.npwp.trim() || undefined;
      u.fotoProfileDataUrl = draft.fotoProfileDataUrl;
      u.fotoGaleri = draft.fotoGaleri;
      u.rekening = draft.rekening;
    });
    logActivity(j.id, "juri", "profile-edit");
    toast({ title: "Profil tersimpan" });
    setEdit(false);
  };

  const downloadPdf = () => {
    const ownerPwd = loadDb().exportPassword || "kurator123";
    const safeName = j.nama.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_");
    const rek = j.rekening ?? DEFAULT_REK;
    downloadLockedPdf({
      filename: `Profil_Juri_${safeName || j.id}.pdf`,
      title: `Profil Juri — ${j.nama}`,
      subtitle: `Dicetak ${new Date().toLocaleString("id-ID")} · Jak Sanggar`,
      ownerPassword: ownerPwd,
      sections: [
        { heading: "Identitas & Keahlian", body:
            `Nama Lengkap: ${j.nama}\n` +
            `Bidang Keahlian: ${j.keahlian}\n` +
            `Pendidikan Terakhir: ${j.pendidikan ?? "-"}\n` +
            `Pengalaman: ${j.pengalaman ?? "-"}\n` +
            `NPWP: ${j.npwp ?? "-"}` },
        { heading: "Kontak", body:
            `Email: ${j.email ?? "-"}\n` +
            `No. HP: ${j.noHp ?? "-"}\n` +
            `Alamat: ${j.alamat ?? "-"}` },
        ...(j.bio ? [{ heading: "Bio", body: j.bio }] : []),
        { heading: "Rekening Bank Honor", body:
            `Bank: ${rek.bank}\n` +
            `No. Rekening: ${rek.nomor || "-"}\n` +
            `Atas Nama: ${rek.atasNama || "-"}` },
      ],
    });
    toast({ title: "PDF profil diunduh" });
  };

  return (
    <div>
      <PageHeader
        title="Profil Saya"
        subtitle="Identitas, keahlian, kontak, rekening honor, dan galeri portofolio Juri."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadPdf} data-testid="button-download-pdf">
              <Download className="h-4 w-4 mr-1" /> Unduh PDF
            </Button>
            {!editMode && <Button onClick={() => setEdit(true)}>Edit Profil</Button>}
          </div>
        }
      />

      <Card className="p-6 mb-6">
        <h3 className="font-serif text-lg mb-4">Foto & Identitas</h3>
        <div className="flex flex-col lg:flex-row gap-6">
          <ProfilePhotoUploader
            value={editMode ? draft.fotoProfileDataUrl : j.fotoProfileDataUrl}
            onChange={v => editMode && setDraft({ ...draft, fotoProfileDataUrl: v })}
            fallbackText={j.nama}
          />
          <div className="flex-1 grid sm:grid-cols-2 gap-4">
            {editMode ? (
              <>
                <FieldEdit label="Nama Lengkap" v={draft.nama} on={v => setDraft({ ...draft, nama: v })} />
                <FieldEdit label="Bidang Keahlian" v={draft.keahlian} on={v => setDraft({ ...draft, keahlian: v })} />
                <FieldEdit label="Pendidikan Terakhir" v={draft.pendidikan} on={v => setDraft({ ...draft, pendidikan: v })} />
                <FieldEdit label="Pengalaman (Tahun)" v={draft.pengalaman} on={v => setDraft({ ...draft, pengalaman: v })} />
              </>
            ) : (
              <>
                <Field label="Nama Lengkap" value={j.nama} />
                <Field label="Bidang Keahlian" value={j.keahlian} />
                <Field label="Pendidikan Terakhir" value={j.pendidikan ?? "-"} />
                <Field label="Pengalaman" value={j.pengalaman ?? "-"} />
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
              <FieldEdit label="NPWP" v={draft.npwp} on={v => setDraft({ ...draft, npwp: v.replace(/[^\d.\-]/g, "").slice(0, 25) })} />
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Alamat</Label>
                <Textarea rows={2} value={draft.alamat} onChange={e => setDraft({ ...draft, alamat: e.target.value })} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bio / Profil Singkat</Label>
                <Textarea rows={3} value={draft.bio} onChange={e => setDraft({ ...draft, bio: e.target.value })} placeholder="Riwayat juri, sertifikasi, dan kontribusi pada kesenian..." />
              </div>
            </>
          ) : (
            <>
              <Field label="Email" value={j.email ?? "-"} />
              <Field label="No. HP" value={j.noHp ?? "-"} />
              <Field label="NPWP" value={j.npwp ?? "-"} />
              <div className="sm:col-span-2"><Field label="Alamat" value={j.alamat ?? "-"} long /></div>
              <div className="sm:col-span-2"><Field label="Bio / Profil Singkat" value={j.bio ?? "-"} long /></div>
            </>
          )}
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h3 className="font-serif text-lg mb-4">Rekening Bank Honor Juri</h3>
        <p className="text-xs text-muted-foreground mb-4">Digunakan untuk menerima honor penilaian dari Kurator/Penyelenggara.</p>
        <RekeningEditor value={editMode ? draft.rekening : (j.rekening ?? DEFAULT_REK)} onChange={r => editMode && setDraft({ ...draft, rekening: r })} editable={editMode} />
      </Card>

      <Card className="p-6 mb-6">
        <h3 className="font-serif text-lg mb-4">Galeri Portofolio</h3>
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
