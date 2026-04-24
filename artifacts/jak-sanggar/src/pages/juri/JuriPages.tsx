import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth, useDb } from "@/lib/auth";
import { save, uid, fmtDateTime } from "@/lib/store";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/system/AnimatedCounter";
import { LoadingOverlay } from "@/components/system/LoadingTumpal";
import { GoldDustField } from "@/components/betawi/Ornaments";
import type { JuriUser, SanggarUser } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Lock, FileVideo, ClipboardList, ChevronRight, Save } from "lucide-react";

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
            <Card key={t.id} className="p-5 cursor-pointer premium-card" onClick={() => navigate(`/juri/${t.sanggarId}`)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.periode}</div>
                  <div className="font-serif text-xl mt-1">{sg?.namaSanggar}</div>
                  <div className="text-sm text-muted-foreground mt-1">{sg?.jenisKesenian.join(", ")}</div>
                </div>
                {final ? <Badge variant="default" className="gap-1"><Lock className="h-3 w-3" />Terkunci</Badge> : <Badge variant="gold">Belum Final</Badge>}
              </div>
              <div className="mt-4 flex items-center justify-end text-sm text-accent-foreground">Buka <ChevronRight className="h-4 w-4" /></div>
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
  const [busy, setBusy] = useState<null | "draft" | "final">(null);
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

  const predikat = naLive < 60 ? "MUDA" : naLive < 80 ? "TRAMPIL" : "MAHIR";
  const predikatColor = naLive < 60 ? "hsl(8 65% 60%)" : naLive < 80 ? "hsl(42 75% 55%)" : "hsl(145 55% 50%)";

  const filledCount = useMemo(() => {
    let n = 0;
    matrix.indikator.forEach(ind => ind.variabel.forEach(v => { if (scores[v.id] != null) n++; }));
    return n;
  }, [scores, matrix]);
  const totalVars = useMemo(() => matrix.indikator.reduce((s, i) => s + i.variabel.length, 0), [matrix]);
  const progress = totalVars === 0 ? 0 : Math.round((filledCount / totalVars) * 100);

  const persistDraft = () => {
    save(d => {
      let s = d.kurasiSubmissions.find(x => x.sanggarId === sanggarId);
      if (!s) { s = { id: uid(), sanggarId: sanggarId!, tahap1: {}, scores: {}, finalized: {}, createdAt: Date.now() }; d.kurasiSubmissions.push(s); }
      s.scores[j.id] = scores;
    });
  };

  const saveDraft = () => {
    setBusy("draft");
    setTimeout(() => {
      persistDraft();
      setBusy(null);
      toast({ title: "Skor disimpan sebagai draft" });
    }, 450);
  };

  const submitFinal = () => {
    setBusy("final");
    setTimeout(() => {
      save(d => {
        let s = d.kurasiSubmissions.find(x => x.sanggarId === sanggarId);
        if (!s) { s = { id: uid(), sanggarId: sanggarId!, tahap1: {}, scores: {}, finalized: {}, createdAt: Date.now() }; d.kurasiSubmissions.push(s); }
        s.scores[j.id] = scores;
        s.finalized[j.id] = Date.now();
      });
      setBusy(null);
      toast({ title: "Nilai akhir telah disubmit & terkunci" });
    }, 700);
  };

  return (
    <div>
      <PageHeader title={`Penilaian: ${sg?.namaSanggar ?? "-"}`} subtitle="Tahap 1 & 2 read-only · Tahap 3 input nilai per variabel via slider." backTo="/juri" />

      <LoadingOverlay show={busy !== null} label={busy === "final" ? "Mengunci nilai akhir..." : "Menyimpan draft..."} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <h3 className="font-serif text-lg flex items-center gap-2"><ClipboardList className="h-5 w-5 text-accent-foreground" />Tahap 1 — Berkas Administrasi <span className="text-xs font-normal text-muted-foreground">(Read-only)</span></h3>
            <div className="mt-4 space-y-3">
              {matrix.indikator.find(i => i.bobot === 30)?.variabel.map(v => (
                <div key={v.id} className="border rounded-md p-3 bg-muted/30">
                  <div className="text-sm font-medium">{v.nama}</div>
                  <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{submission?.tahap1[v.id] || "(belum diisi)"}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-serif text-lg flex items-center gap-2"><FileVideo className="h-5 w-5 text-accent-foreground" />Tahap 2 — Video Unggulan</h3>
            <div className="mt-3 aspect-video bg-muted rounded-md grid place-items-center text-sm text-muted-foreground border border-border/60">
              {submission?.tahap2VideoName ? `Video: ${submission.tahap2VideoName}` : "Belum ada video diunggah"}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="font-serif text-lg">Tahap 3 — Form Penilaian (Slider)</h3>
              <Badge variant="outline" className="gap-1.5">
                <span className="font-mono">{filledCount}/{totalVars}</span>
                <span className="text-muted-foreground">variabel terisi</span>
              </Badge>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, hsl(38 60% 42%), hsl(42 80% 60%))",
                }}
              />
            </div>

            <div className="mt-5 space-y-6">
              {matrix.indikator.map(ind => (
                <div key={ind.id} className="rounded-xl border border-border/70 p-4 bg-card">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{ind.nama}</div>
                    <Badge variant="gold">Bobot {ind.bobot}%</Badge>
                  </div>
                  <div className="mt-4 space-y-5">
                    {ind.variabel.map(v => {
                      const val = scores[v.id] ?? 0;
                      const subtotal = ((val * v.bobot * ind.bobot) / 10000);
                      return (
                        <div key={v.id} className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm flex-1 min-w-0">
                              <div className="truncate">{v.nama}</div>
                              <div className="text-xs text-muted-foreground">Bobot variabel {v.bobot}%</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div
                                className="font-mono text-lg font-semibold tabular-nums w-12 text-right"
                                style={{
                                  color: val >= 80 ? "hsl(145 55% 42%)" : val >= 60 ? "hsl(38 65% 42%)" : val > 0 ? "hsl(8 60% 50%)" : "hsl(var(--muted-foreground))",
                                  transition: "color 0.3s",
                                }}
                              >
                                {val}
                              </div>
                              <div className="text-xs text-muted-foreground tabular-nums w-16 text-right">+{subtotal.toFixed(2)}</div>
                            </div>
                          </div>
                          <Slider
                            value={[val]}
                            min={0}
                            max={100}
                            step={1}
                            disabled={!!final}
                            onValueChange={(vals) => setScores({ ...scores, [v.id]: vals[0] })}
                            aria-label={`Nilai ${v.nama}`}
                            data-testid={`slider-${v.id}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="relative overflow-hidden h-fit lg:sticky lg:top-6 border-2 border-[hsl(38_60%_38%/0.4)]"
          style={{
            background: "linear-gradient(135deg, hsl(222 50% 14%) 0%, hsl(222 55% 11%) 50%, hsl(222 50% 9%) 100%)",
          }}
        >
          <GoldDustField count={14} />
          <div className="absolute inset-x-0 top-0 h-1" style={{ background: "linear-gradient(90deg, transparent, hsl(42 75% 55%), transparent)" }} />
          <div className="relative p-6 text-[hsl(45_85%_92%)]">
            <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "hsl(42 70% 70%)" }}>Nilai Akhir · Live</div>
            <div className="mt-3 flex items-baseline gap-2">
              <AnimatedCounter
                value={naLive}
                decimals={2}
                duration={420}
                className="font-serif text-6xl font-semibold tabular-nums"
                style={{
                  background: "linear-gradient(135deg, hsl(45 90% 78%), hsl(42 75% 55%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 0 24px hsl(42 80% 55% / 0.4)",
                }}
              />
              <span className="text-sm opacity-70">/ 100</span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm opacity-80">Predikat</span>
              <span
                className="px-3 py-1 rounded-full text-xs font-bold tracking-wider"
                style={{
                  background: `${predikatColor}25`,
                  color: predikatColor,
                  border: `1px solid ${predikatColor}55`,
                  transition: "all 0.4s",
                }}
              >
                {predikat}
              </span>
            </div>

            <div className="mt-4 h-2 rounded-full overflow-hidden bg-white/10">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, naLive)}%`,
                  background: "linear-gradient(90deg, hsl(38 60% 42%), hsl(42 85% 65%))",
                  boxShadow: "0 0 12px hsl(42 80% 55% / 0.6)",
                }}
              />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {matrix.indikator.map(ind => {
                let indScore = 0;
                ind.variabel.forEach(v => { indScore += ((scores[v.id] ?? 0) * v.bobot) / 100; });
                const contrib = (indScore * ind.bobot) / 100;
                return (
                  <div key={ind.id} className="rounded-lg p-2 bg-white/5 border border-white/10">
                    <div className="text-[9px] uppercase tracking-wider opacity-60 truncate">{ind.nama}</div>
                    <div className="font-mono font-semibold tabular-nums text-sm" style={{ color: "hsl(42 80% 70%)" }}>
                      {contrib.toFixed(1)}
                    </div>
                  </div>
                );
              })}
            </div>

            {final ? (
              <div className="mt-6 p-3 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-sm flex items-center gap-2">
                <Lock className="h-4 w-4" />Final · {fmtDateTime(final)}
              </div>
            ) : (
              <div className="mt-6 space-y-2">
                <Button variant="secondary" className="w-full gap-2" onClick={saveDraft} disabled={busy !== null}>
                  <Save className="h-4 w-4" />Simpan Draft
                </Button>
                <Button variant="gold" className="w-full gap-2" onClick={submitFinal} disabled={busy !== null}>
                  <CheckCircle2 className="h-4 w-4" />Submit Nilai Akhir
                </Button>
                <p className="text-[11px] text-[hsl(45_70%_82%)]/85">Setelah disubmit, nilai bersifat final dan terkunci dari sisi Juri.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
