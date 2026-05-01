import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/layout/BackButton";
import { Building2, GraduationCap, Music, ShoppingBag } from "lucide-react";

export default function RegisterChoice() {
  const opts = [
    { href: "/daftar/sanggar", icon: <Building2 className="h-7 w-7" />, title: "Sanggar", desc: "Lembaga atau organisasi pengelola kegiatan kesenian." },
    { href: "/daftar/pelatih", icon: <GraduationCap className="h-7 w-7" />, title: "Pelatih", desc: "Tenaga profesional yang menjadi instruktur sanggar." },
    { href: "/daftar/seniman", icon: <Music className="h-7 w-7" />, title: "Seniman", desc: "Anggota sanggar (penari, pemusik, pemeran)." },
    { href: "/daftar/sewa", icon: <ShoppingBag className="h-7 w-7" />, title: "Sewa Jasa", desc: "Penyewa umum / EO / instansi yang ingin memesan SDM, perlengkapan, kostum, atau tempat latihan." },
  ];
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <BackButton to="/" label="Kembali ke Login" />
        <h1 className="mt-3 font-serif text-3xl">Pilih Tipe Pendaftaran</h1>
        <p className="text-sm text-muted-foreground mt-1">Akun Kurator, Admin, dan Juri tidak tersedia melalui pendaftaran publik.</p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {opts.map(o => (
            <Link key={o.href} href={o.href}>
              <Card className="p-6 cursor-pointer hover-elevate active-elevate-2 transition-all h-full">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary grid place-items-center">{o.icon}</div>
                <div className="mt-4 font-serif text-xl">{o.title}</div>
                <div className="mt-2 text-sm text-muted-foreground">{o.desc}</div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
