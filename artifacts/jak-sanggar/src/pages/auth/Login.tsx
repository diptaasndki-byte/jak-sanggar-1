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
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-xl">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-accent">Masuk Akun</p>
          <h1 className="mt-2 font-serif text-3xl">Jak Sanggar</h1>
          <p className="mt-2 text-sm text-muted-foreground">Gunakan akun yang sudah terdaftar untuk melanjutkan.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username / Email</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Memverifikasi..." : "Masuk"}
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <Link href="/lupa-password" className="text-muted-foreground hover:text-foreground hover:underline">Lupa Password?</Link>
          <Link href="/daftar" className="text-muted-foreground hover:text-foreground hover:underline">Daftar Akun</Link>
        </div>
      </section>
    </main>
  );
}
