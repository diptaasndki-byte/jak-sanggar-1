import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/layout/BackButton";
import { load, save } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle } from "lucide-react";

type Step = "phone" | "otp" | "newpw" | "done";

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [generated, setGenerated] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const sendOtp = () => {
    const u = load().users.find(x => (x as any).noHp === phone);
    if (!u) { toast({ title: "Nomor tidak ditemukan", variant: "destructive" }); return; }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGenerated(code);
    setUserId(u.id);
    setStep("otp");
    toast({ title: "Kode OTP dikirim via WhatsApp", description: `(Demo) Kode: ${code}` });
  };

  const verifyOtp = () => {
    if (otp !== generated) { toast({ title: "OTP salah", variant: "destructive" }); return; }
    setStep("newpw");
  };

  const reset = () => {
    if (pw.length < 6) { toast({ title: "Password minimal 6 karakter", variant: "destructive" }); return; }
    if (pw !== pw2) { toast({ title: "Konfirmasi tidak cocok", variant: "destructive" }); return; }
    save(db => {
      const u = db.users.find(x => x.id === userId);
      if (u) u.password = pw;
    });
    setStep("done");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8">
        <BackButton to="/" label="Kembali ke Login" />
        <h1 className="mt-3 font-serif text-2xl">Lupa Password</h1>
        <p className="text-sm text-muted-foreground mt-1">Kami akan mengirimkan kode OTP ke nomor WhatsApp Anda.</p>

        {step === "phone" && (
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label>No. HP / WhatsApp Terdaftar</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0812xxxxxxxx" />
            </div>
            <Button className="w-full gap-2" onClick={sendOtp}><MessageCircle className="h-4 w-4" />Kirim OTP</Button>
            <div className="text-[11px] text-muted-foreground">Coba: 081377889900 (akun Ayu Lestari)</div>
          </div>
        )}

        {step === "otp" && (
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Kode OTP (6 digit)</Label>
              <Input value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} className="tracking-[0.5em] text-center text-lg" />
            </div>
            <Button className="w-full" onClick={verifyOtp}>Verifikasi</Button>
          </div>
        )}

        {step === "newpw" && (
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Password Baru</Label>
              <Input type="password" value={pw} onChange={e => setPw(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Konfirmasi Password</Label>
              <Input type="password" value={pw2} onChange={e => setPw2(e.target.value)} />
            </div>
            <Button className="w-full" onClick={reset}>Simpan Password Baru</Button>
          </div>
        )}

        {step === "done" && (
          <div className="mt-6 space-y-4">
            <div className="rounded-md bg-secondary p-4 text-sm">Password berhasil diperbarui. Silakan masuk kembali.</div>
            <Link href="/"><Button className="w-full">Kembali ke Halaman Login</Button></Link>
          </div>
        )}
      </Card>
    </div>
  );
}
