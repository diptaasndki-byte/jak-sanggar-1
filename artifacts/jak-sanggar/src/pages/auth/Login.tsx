import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const budayaBetawi = [
  { title: "Ondel-Ondel", icon: "face" },
  { title: "Tanjidor", icon: "drum" },
  { title: "Gambang Kromong", icon: "gambang" },
  { title: "Tari Betawi", icon: "dance" },
  { title: "Silat Betawi", icon: "silat" },
  { title: "Rumah Kebaya", icon: "house" },
  { title: "Kembang Kelapa", icon: "flower" },
  { title: "Palang Pintu", icon: "gate" },
];

function BetawiIcon({ type }: { type: string }) {
  return (
    <svg viewBox="0 0 96 96" className="h-16 w-16" aria-hidden="true">
      <circle cx="48" cy="48" r="42" fill="#fff7ea" stroke="#9a642e" strokeWidth="3" />
      {type === "face" && <><circle cx="48" cy="43" r="19" fill="#14365c" /><circle cx="40" cy="42" r="3" fill="#fff7ea" /><circle cx="56" cy="42" r="3" fill="#fff7ea" /><path d="M36 28c7-16 17-16 24 0" fill="#d74b33" /><path d="M34 58c8 9 20 9 28 0" stroke="#fff7ea" strokeWidth="4" fill="none" strokeLinecap="round" /></>}
      {type === "drum" && <><ellipse cx="48" cy="30" rx="22" ry="8" fill="#d74b33" /><path d="M26 30h44l-7 38H33z" fill="#14365c" /><ellipse cx="48" cy="68" rx="15" ry="6" fill="#9a642e" /><path d="M26 22l44 52M70 22 26 74" stroke="#9a642e" strokeWidth="4" strokeLinecap="round" /></>}
      {type === "gambang" && <><path d="M20 62h56v10H20z" fill="#14365c" /><path d="M25 31h8v27h-8zM38 27h8v31h-8zM51 24h8v34h-8zM64 29h8v29h-8z" fill="#d74b33" /><path d="M22 24l52 42" stroke="#9a642e" strokeWidth="4" strokeLinecap="round" /></>}
      {type === "dance" && <><circle cx="48" cy="25" r="8" fill="#14365c" /><path d="M48 34v25M48 43l-20 10M48 43l22-13M44 59l-12 20M52 59l15 18" stroke="#d74b33" strokeWidth="6" strokeLinecap="round" /><path d="M24 51c16 15 33 15 50 0" fill="none" stroke="#9a642e" strokeWidth="4" /></>}
      {type === "silat" && <><circle cx="43" cy="26" r="8" fill="#14365c" /><path d="M42 35l-12 18 25 9 18-15" stroke="#d74b33" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d="M41 59l-21 17M53 62l10 18" stroke="#14365c" strokeWidth="7" strokeLinecap="round" /></>}
      {type === "house" && <><path d="M18 49l30-25 30 25" fill="none" stroke="#14365c" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /><path d="M26 48h44v28H26z" fill="#d74b33" /><path d="M42 76V58h12v18" fill="#fff7ea" /><path d="M18 76h60" stroke="#9a642e" strokeWidth="5" strokeLinecap="round" /></>}
      {type === "flower" && <><path d="M48 76V34" stroke="#14365c" strokeWidth="5" strokeLinecap="round" /><path d="M48 34c-18 2-28-7-31-19 17 1 27 8 31 19zM48 34c18 2 28-7 31-19-17 1-27 8-31 19zM48 44c-16 1-25 8-28 21 15-1 24-7 28-21zM48 44c16 1 25 8 28 21-15-1-24-7-28-21z" fill="#d74b33" opacity="0.9" /></>}
      {type === "gate" && <><path d="M20 72h56M25 72V38h14v34M57 72V38h14v34" stroke="#14365c" strokeWidth="6" strokeLinecap="round" /><path d="M18 38h60l-8-14H26z" fill="#d74b33" /><path d="M39 72V52h18v20" fill="#9a642e" /></>}
    </svg>
  );
}

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const user = await login(username.trim(), password);
      if (!user) {
        toast({ title: "Gagal masuk", description: "Username atau password tidak cocok.", variant: "destructive" });
        return;
      }
      navigate(`/${user.role}`);
    } catch (error) {
      console.error(error);
      toast({ title: "Gagal masuk", description: "Server tidak dapat dihubungi.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 flex items-center justify-center bg-[#f5ead9]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(20,54,92,0.24),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(157,100,45,0.20),transparent_28%),radial-gradient(circle_at_82%_82%,rgba(20,54,92,0.18),transparent_30%),linear-gradient(135deg,#f4eadc,#fffaf2,#efe0cb)]" />
      <div className="absolute inset-0 opacity-35 bg-[linear-gradient(90deg,rgba(19,49,80,0.06)_1px,transparent_1px),linear-gradient(rgba(19,49,80,0.05)_1px,transparent_1px)] bg-[size:42px_42px]" />

      <div className="relative z-10 grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="hidden lg:flex min-h-[600px] flex-col justify-center rounded-[2rem] border border-[#15395c]/10 bg-white/25 p-10 shadow-2xl backdrop-blur-[2px]">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.45em] text-[#9a642e]">Portal Seni Budaya Betawi</p>
            <h1 className="mt-5 font-serif text-7xl font-bold tracking-tight text-[#14365c]">Jak Sanggar</h1>
            <div className="mx-auto mt-6 h-[2px] w-56 bg-[#9a642e]/60" />
          </div>

          <div className="mt-10 grid grid-cols-4 gap-4">
            {budayaBetawi.map((item) => (
              <div key={item.title} className="rounded-2xl border border-[#14365c]/10 bg-[#fffaf2]/75 p-4 text-center shadow-md">
                <div className="flex justify-center"><BetawiIcon type={item.icon} /></div>
                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#14365c]">{item.title}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-[#9a642e]/20 bg-[#14365c]/90 p-6 text-center text-[#fff7ea] shadow-xl">
            <p className="font-serif text-2xl">Sanggar - Seniman - Pelatih - Budaya</p>
            <p className="mt-2 text-sm opacity-80">Satu pintu pendataan, pembinaan, dan kolaborasi seni Betawi.</p>
          </div>
        </section>

        <section className="w-full rounded-2xl border border-[#15395c]/10 bg-white/90 p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-6 text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9a642e]">Masuk Akun</p>
            <h2 className="mt-2 font-serif text-3xl text-[#14365c]">Jak Sanggar</h2>
            <p className="mt-2 text-sm text-muted-foreground">Gunakan akun yang sudah terdaftar untuk melanjutkan.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="username">Username / Email</Label><Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
            <div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            <Button type="submit" disabled={busy} className="w-full bg-[#14365c] hover:bg-[#102b49]">{busy ? "Memverifikasi..." : "Masuk"}</Button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link href="/lupa-password" className="text-muted-foreground hover:text-foreground hover:underline">Lupa Password?</Link>
            <Link href="/daftar" className="text-muted-foreground hover:text-foreground hover:underline">Daftar Akun</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
