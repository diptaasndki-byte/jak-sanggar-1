import { useState } from "react";
import { useAuth, useDb } from "@/lib/auth";
import { save, uid, fmtDateTime } from "@/lib/store";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { SanggarUser } from "@/lib/types";
import { Video, Award } from "lucide-react";

export default function KurasiPage() {
  const { user } = useAuth();
  const db = useDb();
  const { toast } = useToast();
  if (!user || user.role !== "sanggar") return null;
  const sg = user as SanggarUser;
  const matrix = db.kurasiMatrix;
  const submission = db.kurasiSubmissions.find(s => s.sanggarId === sg.id);
  const allVar = matrix.indikator.flatMap(i => i.variabel.map(v => ({ ind: i, v })));
  const [tahap1, setTahap1] = useState<Record<string, string>>(submission?.tahap1 ?? {});
  const [video, setVideo] = useState<File | null>(null);

  const submitTahap = () => {
    save(d => {
      let s = d.kurasiSubmissions.find(x => x.sanggarId === sg.id);
      if (!s) { s = { id: uid(), sanggarId: sg.id, tahap1: {}, scores: {}, finalized: {}, createdAt: Date.now() }; d.kurasiSubmissions.push(s); }
      s.tahap1 = tahap1;
      if (video) s.tahap2VideoName = video.name;
    });
    toast({ title: "Berkas kurasi tersimpan", description: "Data dapat ditinjau oleh Juri yang ditugaskan." });
  };

  // Compute NA from juri scores
  const computeNA = (): { na: number; predikat: string } | null => {
    if (!submission) return null;
    const juriIds = Object.keys(submission.scores);
    if (juriIds.length === 0) return null;
    const naPerJuri = juriIds.map(jid => {
      let total = 0;
      matrix.indikator.forEach(ind => {
        let indScore = 0;
        ind.variabel.forEach(v => {
          const nilai = submission.scores[jid]?.[v.id] ?? 0;
          indScore += (nilai * v.bobot) / 100;
        });
        total += (indScore * ind.bobot) / 100;
      });
      return total;
    });
    const na = naPerJuri.reduce((s, x) => s + x, 0) / naPerJuri.length;
    const predikat = na < 60 ? "MUDA" : na < 80 ? "TRAMPIL" : "MAHIR";
    return { na, predikat };
  };

  const na = computeNA();

  return (
    <div>
      <PageHeader title="Kurasi Sanggar" subtitle="3 tahap penilaian: Administrasi (30%), Tampilan (70%), dan Live." />

      {na && (
        <Card className="p-6 mb-6 bg-gradient-to-r from-primary to-accent text-primary-foreground">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest opacity-80">Nilai Akhir Kurasi</div>
              <div className="font-serif text-5xl mt-1">{na.na.toFixed(2)}</div>
              <div className="text-sm opacity-90 mt-1">Predikat: <b>{na.predikat}</b></div>
            </div>
            <Button variant="secondary" className="gap-2" onClick={() => printSertifikat(sg, na.na, na.predikat)}><Award className="h-4 w-4" />Cetak Sertifikat</Button>
          </div>
        </Card>
      )}

      <Tabs defaultValue="t1">
        <TabsList>
          <TabsTrigger value="t1">Tahap 1 — Administrasi (30%)</TabsTrigger>
          <TabsTrigger value="t2">Tahap 2 — Tampilan (70%)</TabsTrigger>
          <TabsTrigger value="t3">Tahap 3 — Live</TabsTrigger>
        </TabsList>

        <TabsContent value="t1">
          <Card className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">Isi data dukung manajemen sesuai indikator yang ditetapkan Kurator.</p>
            {matrix.indikator.find(i => i.bobot === 30)?.variabel.map(v => (
              <div key={v.id} className="space-y-1.5">
                <Label>{v.nama} <span className="text-xs text-muted-foreground">(bobot {v.bobot}%)</span></Label>
                <Textarea rows={3} value={tahap1[v.id] ?? ""} onChange={e => setTahap1({ ...tahap1, [v.id]: e.target.value })} placeholder="Uraian / data dukung..." />
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="t2">
          <Card className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">Unggah video unggulan (maks 5 menit) berisi 5–7 peserta inti yang wajib memperkenalkan diri.</p>
            <div className="space-y-1.5"><Label>Video Unggulan</Label>
              <Input type="file" accept="video/*" onChange={e => setVideo(e.target.files?.[0] ?? null)} />
              {(video || submission?.tahap2VideoName) && (
                <div className="text-sm text-muted-foreground flex items-center gap-2 mt-2"><Video className="h-4 w-4" />{video?.name ?? submission?.tahap2VideoName}</div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="t3">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Tampil langsung di hadapan Juri yang ditugaskan. Skor Juri otomatis terhitung di sistem ini.</p>
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Status Penilaian Juri</h4>
              <div className="space-y-1.5">
                {(db.penugasanJuri.filter(p => p.sanggarId === sg.id)).map(pj => {
                  const j = db.users.find(u => u.id === pj.juriId);
                  const score = submission?.scores[pj.juriId];
                  const final = submission?.finalized[pj.juriId];
                  return (
                    <div key={pj.id} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                      <div>{(j as any)?.nama ?? "-"} <span className="text-xs text-muted-foreground">({pj.periode})</span></div>
                      <Badge variant={final ? "default" : score ? "secondary" : "outline"}>
                        {final ? `Final • ${fmtDateTime(final)}` : score ? "Draft" : "Belum Menilai"}
                      </Badge>
                    </div>
                  );
                })}
                {db.penugasanJuri.filter(p => p.sanggarId === sg.id).length === 0 && <div className="text-sm text-muted-foreground">Belum ada penugasan juri.</div>}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={submitTahap}>Simpan Berkas Kurasi</Button>
      </div>
    </div>
  );
}

function printSertifikat(sg: SanggarUser, na: number, predikat: string) {
  const html = `<html><head><title>Sertifikat Kurasi</title></head><body style="font-family:Georgia,serif;padding:0;margin:0">
    <div style="border:14px double #8a1a13;margin:24px;padding:60px;text-align:center;background:#fdf6e3;min-height:80vh">
      <div style="font-size:14px;letter-spacing:6px;color:#8a1a13">SERTIFIKAT KURASI SANGGAR</div>
      <h1 style="font-size:36px;margin:16px 0">${sg.namaSanggar}</h1>
      <div style="margin-top:24px">Telah lulus Kurasi Sanggar Jak Sanggar dengan</div>
      <div style="font-size:64px;margin:12px 0;color:#8a1a13"><b>${na.toFixed(2)}</b></div>
      <div style="font-size:24px;letter-spacing:4px">PREDIKAT: <b>${predikat}</b></div>
      <div style="margin-top:48px;font-size:12px;color:#666">Diterbitkan otomatis oleh Sistem Jak Sanggar · ${new Date().toLocaleDateString("id-ID")}</div>
    </div>
  </body></html>`;
  const w = window.open("", "_blank"); if (w) { w.document.write(html); w.document.close(); w.print(); }
}
