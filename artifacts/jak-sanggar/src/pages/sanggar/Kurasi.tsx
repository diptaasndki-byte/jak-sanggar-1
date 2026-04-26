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
import { Video, Award, Trophy } from "lucide-react";
import { AnimatedCounter } from "@/components/system/AnimatedCounter";
import { PucukRebungDivider, BatikCorner } from "@/components/betawi/Ornaments";
import { openPrintWindow, safeHtml } from "@/lib/print";

export default function KurasiPage() {
  const { user } = useAuth();
  const db = useDb();
  const { toast } = useToast();
  if (!user || user.role !== "sanggar") return null;
  const sg = user as SanggarUser;
  const matrix = db.kurasiMatrix;
  const submission = db.kurasiSubmissions.find(s => s.sanggarId === sg.id);
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

  const predikatColor = (p: string) =>
    p === "MAHIR" ? "hsl(145 60% 50%)" :
    p === "TRAMPIL" ? "hsl(42 75% 55%)" :
    "hsl(8 65% 55%)";

  return (
    <div>
      <PageHeader title="Kurasi Sanggar" subtitle="3 tahap penilaian: Administrasi (30%), Tampilan (70%), dan Live." />

      {na && (
        <Card
          className="p-0 mb-6 overflow-hidden text-amber-50 relative"
          style={{
            background: "linear-gradient(135deg, hsl(222 60% 10%) 0%, hsl(220 55% 16%) 55%, hsl(268 40% 22%) 100%)",
            borderColor: "hsl(42 60% 50% / 0.35)",
            boxShadow: "0 20px 50px -10px hsl(222 50% 8% / 0.4), 0 0 0 1px hsl(42 60% 50% / 0.2)",
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><g fill='none' stroke='%23d4a64e' stroke-width='0.7'><path d='M20 80 L35 50 L50 80 Z'/><path d='M50 80 L65 50 L80 80 Z'/></g></svg>\")",
              backgroundSize: "140px 140px",
            }}
          />
          <BatikCorner className="absolute right-2 top-2 w-24 h-24 opacity-25" />

          <div className="relative p-6 sm:p-8 grid sm:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <div className="flex items-center gap-2 text-amber-200/70 text-[10px] uppercase tracking-[0.24em] mb-2">
                <Trophy className="h-3.5 w-3.5" /> Nilai Akhir Kurasi
              </div>
              <div
                className="font-serif text-6xl sm:text-7xl gold-glow leading-none"
                style={{
                  background: "linear-gradient(180deg, hsl(42 90% 80%) 0%, hsl(42 65% 55%) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                <AnimatedCounter value={na.na} decimals={2} format={(n) => n.toFixed(2)} duration={1500} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-amber-100/70 text-sm">Predikat:</span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase"
                  style={{
                    background: `${predikatColor(na.predikat)}28`,
                    border: `1px solid ${predikatColor(na.predikat)}80`,
                    color: predikatColor(na.predikat),
                  }}
                >
                  {na.predikat}
                </span>
              </div>
              <div className="mt-4 max-w-sm"><PucukRebungDivider className="opacity-50" /></div>
            </div>
            <div>
              <Button
                className="btn-gold border-0 gap-2 h-11 px-5"
                onClick={() => printSertifikat(sg, na.na, na.predikat)}
              ><Award className="h-4 w-4" />Cetak Sertifikat</Button>
            </div>
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
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-4">Unggah video unggulan (maks 5 menit) berisi 5–7 peserta inti yang wajib memperkenalkan diri.</p>
            <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6">
              {/* Video preview big with gold border */}
              <div
                className="aspect-video rounded-2xl overflow-hidden grid place-items-center relative"
                style={{
                  background: "linear-gradient(135deg, hsl(222 50% 10%), hsl(220 45% 16%))",
                  border: "1px solid hsl(42 60% 50% / 0.4)",
                  boxShadow: "0 0 0 1px hsl(42 60% 50% / 0.15) inset, 0 20px 40px -10px hsl(222 50% 8% / 0.4)",
                }}
              >
                <div className="text-center text-amber-100/70">
                  <Video className="h-14 w-14 mx-auto mb-3 opacity-60" />
                  <div className="text-sm">{video?.name ?? submission?.tahap2VideoName ?? "Belum ada video unggulan"}</div>
                  <div className="text-[11px] mt-1 opacity-60">Rasio 16:9 · maks 5 menit</div>
                </div>
                <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, hsl(42 75% 55%), transparent)" }} />
                <div className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, hsl(42 75% 55%), transparent)" }} />
              </div>
              <div className="space-y-3">
                <Label>Video Unggulan</Label>
                <Input type="file" accept="video/*" onChange={e => setVideo(e.target.files?.[0] ?? null)} />
                <div className="text-xs text-muted-foreground leading-relaxed">
                  Pastikan setiap peserta memperkenalkan diri (nama, peran, jenis kesenian) di awal video. Video akan ditinjau oleh Juri dan menjadi dasar penilaian Tahap 2.
                </div>
              </div>
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
                    <div key={pj.id} className="flex items-center justify-between border rounded-lg px-3 py-2.5 text-sm">
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
        <Button onClick={submitTahap} className="btn-gold border-0">Simpan Berkas Kurasi</Button>
      </div>
    </div>
  );
}

function printSertifikat(sg: SanggarUser, na: number, predikat: string) {
  const body = safeHtml`<div style="border:14px double #d4a64e;margin:24px;padding:60px;text-align:center;background:linear-gradient(135deg,#0a1428,#15264a 50%,#2c1a40);min-height:80vh;color:#fef3d4">
      <div style="font-size:14px;letter-spacing:6px;color:#d4a64e">SERTIFIKAT KURASI SANGGAR</div>
      <h1 style="font-size:36px;margin:16px 0;color:#fef3d4">${sg.namaSanggar}</h1>
      <div style="margin-top:24px;color:#fef3d4cc">Telah lulus Kurasi Sanggar Jak Sanggar dengan</div>
      <div style="font-size:64px;margin:12px 0;color:#d4a64e;text-shadow:0 0 20px #d4a64e88"><b>${na.toFixed(2)}</b></div>
      <div style="font-size:24px;letter-spacing:4px;color:#fef3d4">PREDIKAT: <b style="color:#d4a64e">${predikat}</b></div>
      <div style="margin-top:48px;font-size:12px;color:#fef3d488">Diterbitkan otomatis oleh Sistem Jak Sanggar · ${new Date().toLocaleDateString("id-ID")}</div>
    </div>`;
  openPrintWindow({
    title: "Sertifikat Kurasi",
    bodyHtml: body,
    bodyStyle: "font-family:Georgia,serif;padding:0;margin:0;background:#0a1428",
  });
}
