import { useState } from "react";
import { useAuth, useDb } from "@/lib/auth";
import { save, fmtDate, logActivity } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { SanggarUser } from "@/lib/types";
import { Lock } from "lucide-react";

const MS_MONTH = 30 * 86400000;

export default function SanggarProfile() {
  const { user } = useAuth();
  const db = useDb();
  const { toast } = useToast();
  const [editMode, setEdit] = useState(false);
  if (!user || user.role !== "sanggar") return null;
  const sg = user as SanggarUser;
  const [draft, setDraft] = useState({ namaKetua: sg.namaKetua, alamat: sg.alamat, noHp: sg.noHp ?? "", email: sg.email ?? "" });

  const periodEnded = Date.now() - sg.editPeriodStart > MS_MONTH;
  const effectiveCount = periodEnded ? 0 : sg.editCount;
  const canEdit = effectiveCount < 2;
  const aktif = db.users.filter(u => (u.role === "seniman" || u.role === "pelatih") && (u as any).sanggarId === sg.id && (u as any).status === "aktif").length;

  const submit = () => {
    save(d => {
      const u = d.users.find(x => x.id === sg.id) as SanggarUser | undefined;
      if (!u) return;
      if (Date.now() - u.editPeriodStart > MS_MONTH) { u.editCount = 0; u.editPeriodStart = Date.now(); }
      u.namaKetua = draft.namaKetua; u.alamat = draft.alamat; u.noHp = draft.noHp; u.email = draft.email;
      u.editCount += 1;
    });
    logActivity(sg.id, "sanggar", "profile-edit");
    setEdit(false);
    toast({ title: "Profil tersimpan" });
  };

  return (
    <div>
      <PageHeader title="Profil Sanggar" subtitle="Identitas Sanggar yang sinkron dengan seluruh sistem." actions={
        canEdit && !editMode ? <Button onClick={() => setEdit(true)} data-testid="button-edit">Edit Profil</Button> : null
      } />
      {!canEdit && (
        <div className="mb-4 p-3 rounded-md bg-muted text-sm flex items-center gap-2"><Lock className="h-4 w-4 text-muted-foreground" />
          Tombol Edit dinonaktifkan (sudah digunakan {effectiveCount}× bulan ini). Aktif kembali setelah {fmtDate(sg.editPeriodStart + MS_MONTH)}.
        </div>
      )}
      <Card className="p-6 grid sm:grid-cols-2 gap-6">
        <Field label="Nama Sanggar" value={sg.namaSanggar} />
        <Field label="Legalitas" value={`${sg.legalitas}${sg.namaBadanHukum ? ` — ${sg.namaBadanHukum}` : ""}`} />
        <Field label="Jenis Kesenian" value={sg.jenisKesenian.join(", ")} />
        <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Anggota Aktif</Label><div className="flex items-center gap-2"><span className="text-2xl font-serif">{aktif}</span><Badge variant="secondary">otomatis</Badge></div></div>
        {editMode ? (
          <>
            <Edit label="Nama Ketua" v={draft.namaKetua} on={v => setDraft({ ...draft, namaKetua: v })} />
            <Edit label="Email" v={draft.email} on={v => setDraft({ ...draft, email: v })} />
            <Edit label="No. HP" v={draft.noHp} on={v => setDraft({ ...draft, noHp: v })} />
            <Edit label="Alamat" v={draft.alamat} on={v => setDraft({ ...draft, alamat: v })} />
          </>
        ) : (
          <>
            <Field label="Nama Ketua" value={sg.namaKetua} />
            <Field label="Email" value={sg.email ?? "-"} />
            <Field label="No. HP" value={sg.noHp ?? "-"} />
            <Field label="Alamat" value={sg.alamat} />
          </>
        )}
        <Field label="Bank" value={sg.rekening.bank} />
        <Field label="No. Rekening" value={sg.rekening.nomor} />
        <Field label="Atas Nama" value={sg.rekening.atasNama} />
        <Field label="Edit terpakai bulan ini" value={`${effectiveCount}/2`} />
      </Card>
      {editMode && (
        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setEdit(false)}>Batal</Button>
          <Button onClick={submit}>Simpan Perubahan</Button>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label><div className="text-sm">{value}</div></div>;
}
function Edit({ label, v, on }: { label: string; v: string; on: (s: string) => void }) {
  return <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label><Input value={v} onChange={e => on(e.target.value)} /></div>;
}
