import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth, useDb } from "@/lib/auth";
import { save, uid, fmtDateTime } from "@/lib/store";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { JuriUser, SanggarUser } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Lock, FileVideo, ClipboardList, ChevronRight } from "lucide-react";

export function JuriHome() {
  const { user } = useAuth();
  const db = useDb();
  if (!user || user.role !== "juri") return null;
  const j = user as JuriUser;
  const tugas = db.penugasanJuri.filter(p => p.juriId === j.id);
  const [, navigate] = useLocation();

  return (
    <div>
      <PageHeader title="Tugas Penilaian" subtitle={`${j.nama} · ${j.keahlian}`} back={false} />
      <div className="grid lg:grid-cols-2 gap-4">
        {tugas.length === 0 && <Card className="lg:col-span-2 p-12 text-center text-muted-foreground">Belum ada penugasan dari Kurator.</Card>}
        {tugas.map(t => {
          const sg = db.users.find(u => u.id === t.sanggarId) as SanggarUser | undefined;
          const sub = db.kurasiSubmissions.find(s => s.sanggarId === t.sanggarId);
          const final = sub?.finalized[j.id];
          return (
            <Card key={t.id} className="p-5 cursor-pointer hover-elevate" onClick={() => navigate(`/juri/${t.sanggarId}`)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.periode}</div>
                  <div className="font-serif text-xl mt-1">{sg?.namaSanggar}</div>
                  <div className="text-sm text-muted-foreground mt-1">{sg?.jenisKesenian.join(", ")}</div>
                </div>
                {final ? <Badge variant="default" className="gap-1"><Lock className="h-3 w-3" />Terkunci</Badge> : <Badge variant="secondary">Belum Final</Badge>}
              </div>
              <div className="mt-4 flex items-center justify-end text-sm text-primary">Buka <ChevronRight className="h-4 w-4" /></div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function JuriScoring() {
  const { user } = useAuth();
  const db = useDb();
  const { toast } = useToast();
  const [match, params] = useRoute("/juri/:sanggarId");
  if (!match || !user || user.role !== "juri") return null;
  const sanggarId = params.sanggarId;
  const j = user as JuriUser;
  const sg = db.users.find(u => u.id === sanggarId) as SanggarUser | undefined;
  const submission = db.kurasiSubmissions.find(s => s.sanggarId === sanggarId);
  const matrix = db.kurasiMatrix;
  const final = submission?.finalized[j.id];
  const [scores, setScores] = useState<Record<string, number>>(submission?.scores[j.id] ?? {});

  const naLive = useMemo(() => {
    let total = 0;
    matrix.indikator.forEach(ind => {
      let indScore = 0;
      ind.variabel.forEach(v => { indScore += ((scores[v.id] ?? 0) * v.bobot) / 100; });
      total += (indScore * ind.bobot) / 100;
    });
    return total;
  }, [scores, matrix]);

  const saveDraft = () => {
    save(d => {
      let s = d.kurasiSubmissions.find(x => x.sanggarId === sanggarId);
      if (!s) { s = { id: uid(), sanggarId: sanggarId!, tahap1: {}, scores: {}, finalized: {}, createdAt: Date.now() }; d.kurasiSubmissions.push(s); }
      s.scores[j.id] = scores;
    });
    toast({ title: "Skor disimpan sebagai draft" });
  };

  const submitFinal = () => {
    save(d => {
      let s = d.kurasiSubmissions.find(x => x.sanggarId === sanggarId);
      if (!s) { s = { id: uid(), sanggarId: sanggarId!, tahap1: {}, scores: {}, finalized: {}, createdAt: Date.now() }; d.kurasiSubmissions.push(s); }
      s.scores[j.id] = scores;
      s.finalized[j.id] = Date.now();
    });
    toast({ title: "Nilai akhir telah disubmit & terkunci" });
  };

  return (
    <div>
      <PageHeader title={`Penilaian: ${sg?.namaSanggar ?? "-"}`} subtitle="Tahap 1 & 2 read-only · Tahap 3 input nilai per variabel." backTo="/juri" />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <h3 className="font-serif text-lg flex items-center gap-2"><ClipboardList className="h-5 w-5" />Tahap 1 — Berkas Administrasi (Read-only)</h3>
            <div className="mt-4 space-y-3">
              {matrix.indikator.find(i => i.bobot === 30)?.variabel.map(v => (
                <div key={v.id} className="border rounded-md p-3">
                  <div className="text-sm font-medium">{v.nama}</div>
                  <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{submission?.tahap1[v.id] || "(belum diisi)"}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-serif text-lg flex items-center gap-2"><FileVideo className="h-5 w-5" />Tahap 2 — Video Unggulan</h3>
            <div className="mt-3 aspect-video bg-muted rounded-md grid place-items-center text-sm text-muted-foreground">
              {submission?.tahap2VideoName ? `Video: ${submission.tahap2VideoName}` : "Belum ada video diunggah"}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-serif text-lg">Tahap 3 — Form Penilaian</h3>
            <div className="mt-4 space-y-5">
              {matrix.indikator.map(ind => (
                <div key={ind.id}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{ind.nama}</div>
                    <Badge variant="outline">Bobot Indikator {ind.bobot}%</Badge>
                  </div>
                  <div className="mt-2 space-y-2">
                    {ind.variabel.map(v => (
                      <div key={v.id} className="grid grid-cols-[1fr_120px_80px] gap-3 items-center">
                        <div className="text-sm">{v.nama}<div className="text-xs text-muted-foreground">Bobot variabel {v.bobot}%</div></div>
                        <Input type="number" min={0} max={100} disabled={!!final}
                          value={scores[v.id] ?? ""}
                          onChange={e => setScores({ ...scores, [v.id]: Math.max(0, Math.min(100, Number(e.target.value))) })}
                          placeholder="0-100" />
                        <div className="text-right text-sm font-mono text-muted-foreground">
                          {(((scores[v.id] ?? 0) * v.bobot * ind.bobot) / 10000).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-primary text-primary-foreground h-fit lg:sticky lg:top-6">
          <div className="text-xs uppercase tracking-widest opacity-80">Nilai Akhir (Live)</div>
          <div className="font-serif text-5xl mt-2">{naLive.toFixed(2)}</div>
          <div className="text-sm opacity-90 mt-1">Predikat: <b>{naLive < 60 ? "MUDA" : naLive < 80 ? "TRAMPIL" : "MAHIR"}</b></div>
          {final ? (
            <div className="mt-6 p-3 rounded-md bg-primary-foreground/15 text-sm flex items-center gap-2"><Lock className="h-4 w-4" />Final · {fmtDateTime(final)}</div>
          ) : (
            <div className="mt-6 space-y-2">
              <Button variant="secondary" className="w-full" onClick={saveDraft}>Simpan Draft</Button>
              <Button variant="default" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2" onClick={submitFinal}><CheckCircle2 className="h-4 w-4" />Submit Nilai Akhir</Button>
              <p className="text-[11px] opacity-75">Setelah disubmit, nilai bersifat final dan terkunci dari sisi Juri.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
