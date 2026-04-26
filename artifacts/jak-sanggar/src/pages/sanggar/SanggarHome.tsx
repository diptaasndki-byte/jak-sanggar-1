import { useEffect, useState } from "react";
import { useAuth, useDb } from "@/lib/auth";
import { fmtRp, fmtDate } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import type { SanggarUser } from "@/lib/types";
import { XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ComposedChart, Bar, Line } from "recharts";
import { Users, CalendarDays, Wallet, Award, Bell, ArrowRight } from "lucide-react";
import { AnimatedCounter } from "@/components/system/AnimatedCounter";
import { PucukRebungDivider, BatikCorner } from "@/components/betawi/Ornaments";
import { BudayaSlider } from "@/components/system/BudayaSlider";

export default function SanggarHome() {
  const { user } = useAuth();
  const db = useDb();
  if (!user || user.role !== "sanggar") return null;
  const sg = user as SanggarUser;

  const members = db.users.filter(u => (u.role === "seniman" || u.role === "pelatih") && (u as any).sanggarId === sg.id && (u as any).status === "aktif");
  const kas = db.kas.filter(k => k.sanggarId === sg.id).sort((a, b) => a.tanggal - b.tanggal);
  const chartData = kas.map(k => ({ tgl: fmtDate(k.tanggal), saldo: k.saldo / 1000, masuk: k.debit / 1000, keluar: k.kredit / 1000 }));
  const pendingReq = db.users.filter(u => (u.role === "seniman" || u.role === "pelatih") && (u as any).sanggarId === sg.id && (u as any).status === "pending").length;
  const pendingIuran = db.iuran.filter(i => i.sanggarId === sg.id && i.status === "pending" && i.buktiDataUrl).length;
  const pendingHonor = db.pengajuanHonor.filter(h => h.sanggarId === sg.id && h.status === "pending").length;
  const banner = db.banners.find(b => b.active);

  const tiles = [
    { href: "/sanggar/keanggotaan", label: "Keanggotaan", icon: Users, count: members.length },
    { href: "/sanggar/latihan", label: "Latihan", icon: CalendarDays, count: db.latihan.filter(l => l.sanggarId === sg.id).length },
    { href: "/sanggar/buku-kas", label: "Buku Kas", icon: Wallet, count: pendingIuran + pendingHonor },
    { href: "/sanggar/kurasi", label: "Kurasi", icon: Award, count: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* HERO CARD */}
      <div
        className="relative overflow-hidden rounded-2xl text-amber-50"
        style={{
          background: "linear-gradient(120deg, hsl(222 60% 10%) 0%, hsl(220 55% 16%) 50%, hsl(268 38% 22%) 100%)",
          boxShadow: "0 20px 50px -10px hsl(222 50% 8% / 0.45), 0 0 0 1px hsl(42 60% 50% / 0.18)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='%23d4a64e' stroke-width='0.7'><path d='M20 100 L40 60 L60 100 Z'/><path d='M60 100 L80 60 L100 100 Z'/><circle cx='60' cy='40' r='4'/></g></svg>\")",
            backgroundSize: "160px 160px",
          }}
        />
        <BatikCorner className="absolute right-0 top-0 w-32 h-32 opacity-30" />
        <BatikCorner className="absolute left-0 bottom-0 w-24 h-24 opacity-20 rotate-180" />

        <div className="relative grid lg:grid-cols-5 gap-6 p-6 lg:p-8">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 text-amber-200/70 text-[10px] uppercase tracking-[0.24em] mb-2">
              <span className="h-1 w-6 rounded-full bg-amber-400" />Sanggar Aktif
            </div>
            <h1
              className="font-serif text-3xl sm:text-4xl xl:text-5xl leading-tight"
              style={{
                background: "linear-gradient(180deg, hsl(42 80% 88%) 0%, hsl(42 65% 55%) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {sg.namaSanggar}
            </h1>
            <p className="text-amber-50/75 text-sm mt-2.5">
              Ketua: <span className="text-amber-50">{sg.namaKetua}</span> · {sg.jenisKesenian.join(" · ")}
            </p>
            <div className="mt-5 max-w-md"><PucukRebungDivider className="opacity-50" /></div>
          </div>

          {/* Saldo big */}
          <div className="lg:col-span-2 flex flex-col justify-center lg:items-end">
            <div className="text-amber-200/55 text-[10px] uppercase tracking-[0.24em] mb-1.5">Saldo Kas Sanggar</div>
            <div className="font-serif text-3xl sm:text-4xl text-amber-50 gold-glow">
              <AnimatedCounter value={sg.saldo} format={(n) => fmtRp(n)} duration={1300} />
            </div>
            <div className="mt-3 inline-flex items-center gap-2 text-xs text-amber-100/70 bg-amber-500/10 border border-amber-300/25 rounded-full px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Realtime · Tersinkron
            </div>
          </div>
        </div>
      </div>

      {banner && (
        <div className="rounded-xl bg-accent/12 border border-accent/30 p-4 flex items-start gap-3">
          <Bell className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="text-sm text-foreground/85">{banner.teks}</div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Saldo Kas" value={sg.saldo} format={(n) => fmtRp(n)} accent />
        <Stat label="Anggota Aktif" value={members.length} />
        <Stat label="Permohonan Gabung" value={pendingReq} pending={pendingReq > 0} />
        <Stat label="Validasi Tertunda" value={pendingIuran + pendingHonor} pending={(pendingIuran + pendingHonor) > 0} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg">Grafik Kas</h3>
              <p className="text-xs text-muted-foreground">Riwayat saldo (dalam ribu Rupiah)</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-6 rounded-sm" style={{ background: "linear-gradient(90deg, hsl(42 75% 55%), hsl(38 60% 42%))", boxShadow: "0 0 6px hsl(42 75% 55% / 0.5)" }} />Saldo</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: "linear-gradient(180deg, hsl(145 55% 50%), hsl(145 55% 38%))" }} />Pemasukan</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: "linear-gradient(180deg, hsl(8 65% 55%), hsl(8 60% 42%))" }} />Pengeluaran</span>
            </div>
          </div>
          <div className="h-64 mt-4">
            {chartData.length === 0 ? (
              <div className="h-full grid place-items-center text-sm text-muted-foreground">Belum ada transaksi.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} barGap={2}>
                  <defs>
                    <linearGradient id="masukBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(145 55% 50%)" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="hsl(145 55% 38%)" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="keluarBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(8 65% 55%)" stopOpacity={0.92} />
                      <stop offset="100%" stopColor="hsl(8 60% 42%)" stopOpacity={0.65} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="tgl" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--accent) / 0.07)" }}
                    contentStyle={{
                      background: "hsl(var(--popover) / 0.92)",
                      border: "1px solid hsl(var(--accent) / 0.35)",
                      borderRadius: 12,
                      backdropFilter: "blur(14px)",
                      boxShadow: "0 14px 32px -10px hsl(222 50% 10% / 0.35), 0 0 0 1px hsl(42 60% 50% / 0.08)",
                      padding: "8px 12px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600, fontSize: 11, marginBottom: 4 }}
                    itemStyle={{ fontSize: 12 }}
                    formatter={(value: number, name: string) => [`${value.toLocaleString("id-ID")} rb`, name === "masuk" ? "Pemasukan" : name === "keluar" ? "Pengeluaran" : "Saldo"]}
                  />
                  <Bar dataKey="masuk" fill="url(#masukBar)" radius={[5, 5, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="keluar" fill="url(#keluarBar)" radius={[5, 5, 0, 0]} maxBarSize={28} />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    stroke="hsl(42 75% 55%)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "hsl(42 80% 60%)", stroke: "hsl(38 60% 38%)", strokeWidth: 1 }}
                    activeDot={{ r: 5, fill: "hsl(42 85% 65%)", stroke: "hsl(38 60% 38%)" }}
                    style={{ filter: "drop-shadow(0 0 6px hsl(42 75% 55% / 0.5))" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Informasi Kebudayaan slider — diatur oleh kurator/admin */}
        <BudayaSlider items={db.infoBudaya} />
      </div>

      <div>
        <h3 className="font-serif text-lg mb-3">Menu Cepat</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {tiles.map(t => (
            <Link key={t.href} href={t.href}>
              <Card className="p-5 cursor-pointer h-full">
                <div className="flex items-start justify-between">
                  <div
                    className="h-11 w-11 rounded-xl grid place-items-center"
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--accent) / 0.18), hsl(var(--accent) / 0.05))",
                      border: "1px solid hsl(var(--accent) / 0.3)",
                      color: "hsl(var(--accent))",
                    }}
                  ><t.icon className="h-5 w-5" /></div>
                  {t.count > 0 && <Badge variant="secondary">{t.count}</Badge>}
                </div>
                <div className="mt-3 font-medium">{t.label}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1 group">
                  Buka <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent, pending, format }: {
  label: string; value: number; accent?: boolean; pending?: boolean;
  format?: (n: number) => string;
}) {
  return (
    <Card
      className={`p-5 relative overflow-hidden ${accent ? "text-primary-foreground" : ""}`}
      style={accent ? {
        background: "linear-gradient(135deg, hsl(222 55% 14%) 0%, hsl(220 50% 22%) 100%)",
        borderColor: "hsl(42 60% 50% / 0.35)",
      } : undefined}
    >
      {accent && (
        <div
          className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, hsl(42 80% 60% / 0.45) 0%, transparent 70%)" }}
        />
      )}
      <div className={`relative text-[10px] uppercase tracking-[0.18em] ${accent ? "text-amber-200/80" : "text-muted-foreground"}`}>{label}</div>
      <div className={`relative mt-2 text-2xl sm:text-3xl font-serif ${pending ? "text-destructive" : accent ? "text-amber-50 gold-glow" : ""}`}>
        <AnimatedCounter value={value} format={format ?? ((n) => n.toLocaleString("id-ID"))} duration={1100} />
      </div>
    </Card>
  );
}
