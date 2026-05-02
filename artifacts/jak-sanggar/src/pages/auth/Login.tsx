import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(20,54,92,0.22),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(157,100,45,0.18),transparent_28%),linear-gradient(135deg,#f4eadc,#fffaf2,#efe0cb)]" />
      <div className="absolute inset-0 opacity-40 bg-[linear-gradient(90deg,rgba(19,49,80,0.06)_1px,transparent_1px),linear-gradient(rgba(19,49,80,0.05)_1px,transparent_1px)] bg-[size:42px_42px]" />

      <div className="relative z-10 grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden lg:flex min-h-[560px] items-center justify-center rounded-[2rem] border border-[#15395c]/10 bg-white/20 p-10 shadow-2xl backdrop-blur-[2px]">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.45em] text-[#9a642e]">Dinas Kebudayaan</p>
            <h1 className="mt-6 font-serif text-7xl font-bold tracking-tight text-[#14365c]">Jak Sanggar</h1>
            <div className="mx-auto mt-7 h-[2px] w-48 bg-[#9a642e]/60" />
          </div>
        </section>

        <section className="w-full rounded-2xl border border-[#15395c]/10 bg-white/85 p-8 shadow-2xl backdrop-blur-md">
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
