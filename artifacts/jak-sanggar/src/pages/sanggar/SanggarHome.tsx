import { useAuth, useDb } from "@/lib/auth";
import { fmtRp, fmtDate } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import type { SanggarUser } from "@/lib/types";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Users, CalendarDays, Wallet, Award, Bell, ArrowRight } from "lucide-react";

export default function SanggarHome() {
  const { user } = useAuth();
  const db = useDb();
  if (!user || user.role !== "sanggar") return null;
  const sg = user as SanggarUser;

  const members = db.users.filter(u => (u.role === "seniman" || u.role === "pelatih") && (u as any).sanggarId === sg.id && (u as any).status === "aktif");
  const kas = db.kas.filter(k => k.sanggarId === sg.id).sort((a, b) => a.tanggal - b.tanggal);
  const chartData = kas.map(k => ({ tgl: fmtDate(k.tanggal), saldo: k.saldo / 1000 }));
  const pendingReq = db.users.filter(u => (u.role === "seniman" || u.role === "pelatih") && (u as any).sanggarId === sg.id && (u as any).status === "pending").length;
  const pendingIuran = db.iuran.filter(i => i.sanggarId === sg.id && i.status === "pending" && i.buktiDataUrl).length;
  const pendingHonor = db.pengajuanHonor.filter(h => h.sanggarId === sg.id && h.status === "pending").length;
  const news = [...db.news].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  const banner = db.banners.find(b => b.active);

  const tiles = [
    { href: "/sanggar/keanggotaan", label: "Keanggotaan", icon: Users, count: members.length },
    { href: "/sanggar/latihan", label: "Latihan", icon: CalendarDays, count: db.latihan.filter(l => l.sanggarId === sg.id).length },
    { href: "/sanggar/buku-kas", label: "Buku Kas", icon: Wallet, count: pendingIuran + pendingHonor },
    { href: "/sanggar/kurasi", label: "Kurasi", icon: Award, count: 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">{sg.namaSanggar}</h1>
        <p className="text-muted-foreground text-sm mt-1">Ketua: {sg.namaKetua} · {sg.jenisKesenian.join(", ")}</p>
      </div>

      {banner && (
        <div className="rounded-lg bg-accent/15 border border-accent/30 p-4 flex items-start gap-3">
          <Bell className="h-5 w-5 text-accent-foreground/80 shrink-0 mt-0.5" />
          <div className="text-sm text-accent-foreground/90">{banner.teks}</div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Saldo Kas" value={fmtRp(sg.saldo)} accent />
        <Stat label="Anggota Aktif" value={String(members.length)} />
        <Stat label="Permohonan Gabung" value={String(pendingReq)} pending={pendingReq > 0} />
        <Stat label="Validasi Tertunda" value={String(pendingIuran + pendingHonor)} pending={(pendingIuran + pendingHonor) > 0} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg">Grafik Kas</h3>
              <p className="text-xs text-muted-foreground">Riwayat saldo (dalam ribu Rupiah)</p>
            </div>
          </div>
          <div className="h-56 mt-4">
            {chartData.length === 0 ? (
              <div className="h-full grid place-items-center text-sm text-muted-foreground">Belum ada transaksi.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="tgl" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="saldo" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-serif text-lg">Berita Terbaru</h3>
          <div className="mt-3 space-y-3">
            {news.length === 0 && <p className="text-sm text-muted-foreground">Belum ada berita.</p>}
            {news.map(n => (
              <div key={n.id} className="border-l-2 border-primary pl-3">
                <div className="text-sm font-medium">{n.judul}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{fmtDate(n.createdAt)}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.isi}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <h3 className="font-serif text-lg mb-3">Menu Cepat</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {tiles.map(t => (
            <Link key={t.href} href={t.href}>
              <Card className="p-5 cursor-pointer hover-elevate active-elevate-2 h-full">
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-md bg-primary/10 text-primary grid place-items-center"><t.icon className="h-5 w-5" /></div>
                  {t.count > 0 && <Badge variant="secondary">{t.count}</Badge>}
                </div>
                <div className="mt-3 font-medium">{t.label}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">Buka <ArrowRight className="h-3 w-3" /></div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent, pending }: { label: string; value: string; accent?: boolean; pending?: boolean }) {
  return (
    <Card className={`p-5 ${accent ? "bg-primary text-primary-foreground" : ""}`}>
      <div className={`text-xs uppercase tracking-wide ${accent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{label}</div>
      <div className={`mt-2 text-2xl font-serif ${pending ? "text-accent-foreground" : ""}`}>{value}</div>
    </Card>
  );
}
