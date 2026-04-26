import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, useDb } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GoldDustField, OndelOndelSilhouette, PucukRebungDivider, TumpalSpinner } from "@/components/betawi/Ornaments";
import { getBrandIcon } from "@/lib/brandIcons";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const db = useDb();
  const brand = db.appearance.brand;
  const appName = brand?.appName || "Jak Sanggar";
  const tagline = brand?.appTagline || "Budaya Naik Kelas, Digital Tanpa Batas";
  const eyebrow = brand?.loginEyebrow || "Konsorsium Sanggar Betawi";
  const BrandIcon = getBrandIcon(brand?.iconKey);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setTimeout(() => {
      const u = login(username.trim(), password);
      if (!u) {
        setBusy(false);
        toast({ title: "Gagal masuk", description: "Username atau password tidak cocok.", variant: "destructive" });
        return;
      }
      toast({ title: `Selamat datang, ${(u as any).nama || (u as any).namaSanggar || u.username}` });
      navigate(`/${u.role}`);
    }, 380);
  };

  return (
    <div
      className="min-h-screen grid lg:grid-cols-5 relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at top left, hsl(38 35% 96%) 0%, hsl(220 25% 92%) 100%)",
      }}
    >
      {/* LEFT: Hero panel */}
      <div
        className="hidden lg:flex lg:col-span-3 relative overflow-hidden text-sidebar-foreground p-10 xl:p-14 flex-col justify-between"
        style={{
          background: "linear-gradient(135deg, hsl(222 60% 8%) 0%, hsl(222 55% 14%) 50%, hsl(268 40% 18%) 100%)",
        }}
      >
        {/* Batik watermark */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><g fill='none' stroke='%23d4a64e' stroke-width='0.8'><path d='M30 130 L60 70 L90 130 Z'/><path d='M70 130 L100 70 L130 130 Z'/><circle cx='80' cy='50' r='4'/><circle cx='80' cy='50' r='12'/><path d='M70 20 L80 8 L90 20 L80 32 Z'/><path d='M0 80 L20 60 L40 80 L20 100 Z'/><path d='M120 80 L140 60 L160 80 L140 100 Z'/></g></svg>\")",
            backgroundSize: "260px 260px",
          }}
        />

        {/* Gold dust */}
        <GoldDustField count={32} />

        {/* Ondel-ondel silhouette in corner */}
        <div className="absolute -right-6 -bottom-10 opacity-[0.09] pointer-events-none">
          <OndelOndelSilhouette className="w-72 h-[440px]" color="hsl(42 75% 65%)" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3.5">
            <div
              className="h-12 w-12 rounded-xl grid place-items-center"
              style={{
                background: "linear-gradient(135deg, hsl(42 80% 60%) 0%, hsl(38 65% 42%) 100%)",
                boxShadow: "0 0 30px hsl(42 75% 50% / 0.55), 0 1px 0 hsl(42 90% 80%) inset",
              }}
            >
              {brand?.logoDataUrl ? (
                <img src={brand.logoDataUrl} alt={appName} className="h-10 w-10 rounded-md object-cover" />
              ) : (
                <BrandIcon className="h-6 w-6" style={{ color: "hsl(222 60% 10%)" }} />
              )}
            </div>
            <div>
              <div className="font-serif text-2xl tracking-tight">{appName}</div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-amber-100/55 mt-0.5">{eyebrow}</div>
            </div>
          </div>
        </div>

        <div className="relative max-w-xl">
          <div className="text-amber-200/60 text-[11px] uppercase tracking-[0.32em] mb-3">— Tagline Resmi —</div>
          <h2
            className="font-serif text-4xl xl:text-[58px] leading-[1.05] gold-glow"
            style={{
              background: "linear-gradient(180deg, hsl(42 80% 80%) 0%, hsl(42 70% 55%) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {tagline}
          </h2>
          <div className="mt-6 max-w-md">
            <PucukRebungDivider className="opacity-70" />
          </div>
          <p className="mt-6 text-amber-50/80 text-base leading-relaxed max-w-md">
            Satu pintu untuk seluruh sanggar, pelatih, dan seniman di Jakarta —
            kelola anggota, jadwal latihan, buku kas, hingga kurasi sanggar dalam satu sistem yang terpercaya.
          </p>
        </div>

        <div className="relative flex items-center justify-between text-xs text-amber-100/45">
          <div>© {new Date().getFullYear()} Jak Sanggar · Pemerintah Provinsi DKI Jakarta</div>
          <div className="hidden xl:flex items-center gap-2 uppercase tracking-[0.18em]">
            <span className="h-1 w-1 rounded-full bg-amber-300/60" />
            Edisi Premium
          </div>
        </div>
      </div>

      {/* RIGHT: Form */}
      <div className="lg:col-span-2 flex items-center justify-center p-6 sm:p-10 relative">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none lg:hidden"
          style={{
            background: "linear-gradient(180deg, hsl(222 50% 12%) 0%, transparent 70%)",
          }}
        />
        <div className="relative w-full max-w-md">
          <div
            className="glass rounded-2xl p-8 shadow-2xl"
            style={{
              boxShadow: "0 25px 50px -10px hsl(222 60% 10% / 0.25), 0 0 0 1px hsl(42 60% 50% / 0.18), 0 0 60px hsl(42 75% 50% / 0.08)",
            }}
          >
            <div className="lg:hidden mb-5 flex items-center gap-2.5">
              {brand?.logoDataUrl ? (
                <img src={brand.logoDataUrl} alt={appName} className="h-9 w-9 rounded-md object-cover" />
              ) : (
                <div className="h-9 w-9 rounded-md grid place-items-center btn-gold">
                  <BrandIcon className="h-5 w-5" />
                </div>
              )}
              <div className="font-serif text-xl">{appName}</div>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <span className="h-1 w-6 rounded-full bg-accent" />
              <span className="text-[10px] uppercase tracking-[0.24em] text-accent">Masuk Akun</span>
            </div>
            <h1 className="font-serif text-3xl">Selamat Datang Kembali</h1>
            <p className="text-sm text-muted-foreground mt-1.5">Gunakan kredensial yang terdaftar untuk melanjutkan.</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="u" className="text-xs uppercase tracking-wider text-muted-foreground">Username / Email</Label>
                <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="contoh: betawi.merah" required data-testid="input-username" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p" className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                <div className="relative">
                  <Input id="p" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="input-password" className="pr-10" />
                  <button type="button" data-tradisi="silent" onClick={() => setShow(s => !s)} aria-label={show ? "Sembunyikan password" : "Tampilkan password"} aria-pressed={show} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={busy} className="w-full btn-gold border-0 h-11 text-sm font-semibold tracking-wide" data-testid="button-login">
                {busy ? <TumpalSpinner size={18} /> : <Lock className="h-4 w-4" />}
                {busy ? "Memverifikasi..." : "Masuk Aman"}
              </Button>
            </form>

            <div className="mt-5 flex items-center justify-between text-sm">
              <Link href="/lupa-password" className="text-foreground/70 hover:text-accent hover:underline transition-colors">Lupa Password?</Link>
              <Link href="/daftar" className="text-foreground/70 hover:text-accent hover:underline transition-colors">Daftar Akun</Link>
            </div>

            <div className="mt-6 relative">
              <PucukRebungDivider className="opacity-40" />
              <div
                className="mt-4 p-3.5 rounded-xl text-[11px] text-muted-foreground leading-relaxed"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--muted) / 0.6), hsl(var(--accent) / 0.04))",
                  border: "1px solid hsl(var(--accent) / 0.18)",
                }}
              >
                <div className="font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-accent" />Akun Demo
                </div>
                Kurator: <code className="text-foreground">Penguasa jak1</code> / <code className="text-foreground">ayamayaman</code><br />
                Sanggar: <code className="text-foreground">betawi.merah</code> / <code className="text-foreground">sanggar123</code><br />
                Pelatih: <code className="text-foreground">pelatih.iwan</code> / <code className="text-foreground">pelatih123</code><br />
                Seniman: <code className="text-foreground">ayu.tari</code> / <code className="text-foreground">seniman123</code><br />
                Juri: <code className="text-foreground">juri1</code> / <code className="text-foreground">juri123</code> · Admin: <code className="text-foreground">admin1</code> / <code className="text-foreground">admin123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
