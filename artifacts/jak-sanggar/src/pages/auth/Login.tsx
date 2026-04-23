import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Sparkles, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = login(username.trim(), password);
    if (!u) {
      toast({ title: "Gagal masuk", description: "Username atau password tidak cocok.", variant: "destructive" });
      return;
    }
    toast({ title: `Selamat datang, ${(u as any).nama || (u as any).namaSanggar || u.username}` });
    navigate(`/${u.role}`);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-5 bg-background">
      <div className="hidden lg:flex lg:col-span-3 relative overflow-hidden bg-sidebar text-sidebar-foreground p-12 flex-col justify-between">
        <div className="absolute inset-0 batik-pattern opacity-60" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="font-serif text-2xl">Jak Sanggar</div>
              <div className="text-xs uppercase tracking-widest text-sidebar-foreground/60">Sistem Manajemen Kesenian Jakarta</div>
            </div>
          </div>
        </div>
        <div className="relative max-w-lg">
          <h2 className="font-serif text-4xl xl:text-5xl leading-tight text-sidebar-foreground">
            Satu pintu untuk seluruh sanggar, pelatih, dan seniman di Jakarta.
          </h2>
          <p className="mt-5 text-sidebar-foreground/75">
            Kelola anggota, jadwal latihan, buku kas, hingga kurasi sanggar dalam satu sistem yang terpercaya.
          </p>
        </div>
        <div className="relative text-xs text-sidebar-foreground/60">
          © {new Date().getFullYear()} Jak Sanggar · Pemerintah Provinsi DKI Jakarta
        </div>
      </div>

      <div className="lg:col-span-2 flex items-center justify-center p-6 sm:p-10">
        <Card className="w-full max-w-md p-8">
          <div className="lg:hidden mb-6 flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-md bg-primary text-primary-foreground grid place-items-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="font-serif text-xl">Jak Sanggar</div>
          </div>
          <h1 className="font-serif text-2xl">Masuk ke Akun Anda</h1>
          <p className="text-sm text-muted-foreground mt-1">Gunakan kredensial yang terdaftar untuk melanjutkan.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="u">Username / Email</Label>
              <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="contoh: betawi.merah" required data-testid="input-username" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p">Password</Label>
              <div className="relative">
                <Input id="p" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="input-password" />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" data-testid="button-login">Masuk</Button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link href="/lupa-password" className="text-primary hover:underline">Lupa Password?</Link>
            <Link href="/daftar" className="text-primary hover:underline">Belum punya akun? Daftar</Link>
          </div>

          <div className="mt-6 p-3 rounded-md bg-muted/60 text-[11px] text-muted-foreground leading-relaxed">
            <div className="font-medium text-foreground mb-1">Akun Demo</div>
            Kurator: <code>Penguasa jak1</code> / <code>ayamayaman</code><br />
            Sanggar: <code>betawi.merah</code> / <code>sanggar123</code><br />
            Pelatih: <code>pelatih.iwan</code> / <code>pelatih123</code><br />
            Seniman: <code>ayu.tari</code> / <code>seniman123</code><br />
            Juri: <code>juri1</code> / <code>juri123</code> · Admin: <code>admin1</code> / <code>admin123</code>
          </div>
        </Card>
      </div>
    </div>
  );
}
