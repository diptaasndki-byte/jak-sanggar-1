import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/lib/auth";
import { TradisiLisanProvider } from "@/components/system/TradisiLisanBetawi";
import { AppShell } from "@/components/layout/AppShell";
import type { ReactNode } from "react";

import Login from "@/pages/auth/Login";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import RegisterChoice from "@/pages/auth/RegisterChoice";
import { RegisterSanggar, RegisterPelatih, RegisterSeniman, RegisterSewa } from "@/pages/auth/RegisterForms";

import SanggarHome from "@/pages/sanggar/SanggarHome";
import SanggarProfile from "@/pages/sanggar/Profile";
import Members from "@/pages/sanggar/Members";
import LatihanPage from "@/pages/sanggar/Latihan";
import BukuKas from "@/pages/sanggar/BukuKas";
import Pembinaan from "@/pages/sanggar/Pembinaan";
import KurasiPage from "@/pages/sanggar/Kurasi";
import Regenerasi from "@/pages/sanggar/Regenerasi";
import AsetPage from "@/pages/sanggar/Aset";
import SarprasPage from "@/pages/sanggar/Sarpras";
import KatalogKerjasama from "@/pages/sanggar/kerjasama/Katalog";
import PermintaanKerjasama from "@/pages/sanggar/kerjasama/Permintaan";
import KerjasamaDetail from "@/pages/sanggar/kerjasama/Detail";

import { PelatihHome, PelatihDaftarLatih, PelatihHonor, PelatihSlip, PelatihDistribusi, PelatihSertif } from "@/pages/pelatih/PelatihPages";
import { SenimanHome, SenimanTagihan, SenimanRiwayat } from "@/pages/seniman/SenimanPages";
import SenimanProfile from "@/pages/seniman/Profile";
import PermintaanSdmReadOnly from "@/pages/seniman/PermintaanSdm";
import { JuriHome, JuriScoring } from "@/pages/juri/JuriPages";
import JuriProfile from "@/pages/juri/Profile";
import { AdminHome, AdminBerita, AdminBanner, AdminSlider } from "@/pages/admin/AdminPages";
import { KuratorHome, KuratorAccounts, KuratorMatriks, KuratorAssign, KuratorStaff, KuratorAppearance, KuratorWaktu } from "@/pages/kurator/KuratorPages";
import { SewaHome, SewaKatalog } from "@/pages/sewa/SewaPages";
import { SewaItemDetail, SewaPesananList, SewaPesananDetail } from "@/pages/sewa/SewaPemesanan";
import { PermintaanSewaMasuk, PermintaanSewaDetail } from "@/pages/sanggar/PermintaanSewa";
import { PenugasanSewaInbox, PenugasanSewaDetail } from "@/pages/sdm/PenugasanSewa";
import KuratorKerjasama from "@/pages/kurator/KuratorKerjasama";
import { KuratorManajemenData } from "@/pages/kurator/KuratorManajemenData";
import InfoBudayaManager from "@/pages/shared/InfoBudayaManager";

import {
  LayoutDashboard, Users, Calendar, Wallet, BookOpen, Award, GraduationCap,
  Receipt, ScrollText, FileText, Send, Newspaper, Image as ImageIcon, MessageSquare,
  Sliders, Clock, Palette, Shield, ClipboardList, Trophy, UserCog,
  Package, Building2, Handshake, Inbox, Landmark, Database, ShoppingBag,
} from "lucide-react";

const queryClient = new QueryClient();

function Guard({ role, children }: { role: string; children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">
        Memuat sesi…
      </div>
    );
  }
  if (!user) return <Redirect to="/" />;
  if (user.role !== role) return <Redirect to={`/${user.role}`} />;
  return <>{children}</>;
}

const sanggarNav = [
  { label: "Beranda", href: "/sanggar", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Profil Sanggar", href: "/sanggar/profil", icon: <BookOpen className="h-4 w-4" /> },
  {
    label: "Keanggotaan",
    href: "/sanggar/keanggotaan",
    icon: <Users className="h-4 w-4" />,
    children: [
      { label: "Regenerasi", href: "/sanggar/regenerasi", icon: <ScrollText className="h-4 w-4" /> },
    ],
  },
  { label: "Latihan", href: "/sanggar/latihan", icon: <Calendar className="h-4 w-4" /> },
  {
    label: "Pembinaan",
    href: "/sanggar/pembinaan",
    icon: <GraduationCap className="h-4 w-4" />,
    children: [
      { label: "Kurasi Sanggar", href: "/sanggar/kurasi", icon: <Trophy className="h-4 w-4" /> },
    ],
  },
  {
    label: "Aset & Sarana",
    href: "/sanggar/aset",
    icon: <Package className="h-4 w-4" />,
    children: [
      { label: "Sarana & Prasarana", href: "/sanggar/sarpras", icon: <Building2 className="h-4 w-4" /> },
    ],
  },
  {
    label: "Kerjasama",
    href: "/sanggar/kerjasama",
    icon: <Handshake className="h-4 w-4" />,
    children: [
      { label: "Permintaan", href: "/sanggar/kerjasama/permintaan", icon: <Inbox className="h-4 w-4" /> },
    ],
  },
  { label: "Sewa Jasa Masuk", href: "/sanggar/permintaan-sewa", icon: <ShoppingBag className="h-4 w-4" /> },
  { label: "Buku Kas", href: "/sanggar/buku-kas", icon: <Wallet className="h-4 w-4" /> },
];
const pelatihNav = [
  { label: "Beranda", href: "/pelatih", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Daftar Latih", href: "/pelatih/daftar-latih", icon: <Calendar className="h-4 w-4" /> },
  { label: "Pengajuan Honor", href: "/pelatih/honor", icon: <Send className="h-4 w-4" /> },
  { label: "Arsip E-Slip", href: "/pelatih/slip", icon: <FileText className="h-4 w-4" /> },
  { label: "Honor Proyek", href: "/pelatih/honor-proyek", icon: <Wallet className="h-4 w-4" /> },
  { label: "Permintaan SDM", href: "/pelatih/permintaan-sdm", icon: <Handshake className="h-4 w-4" /> },
  { label: "Penugasan Sewa", href: "/pelatih/penugasan-sewa", icon: <ShoppingBag className="h-4 w-4" /> },
  { label: "Sertifikat", href: "/pelatih/sertifikat", icon: <Award className="h-4 w-4" /> },
];
const senimanNav = [
  { label: "Beranda", href: "/seniman", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Profil Saya", href: "/seniman/profil", icon: <UserCog className="h-4 w-4" /> },
  {
    label: "Keuangan",
    href: "/seniman/keuangan",
    icon: <Wallet className="h-4 w-4" />,
    children: [
      { label: "Tagihan Saya", href: "/seniman/tagihan", icon: <Receipt className="h-4 w-4" /> },
      { label: "Honor Komersial", href: "/seniman/honor-komersial", icon: <Wallet className="h-4 w-4" /> },
    ],
  },
  { label: "Permintaan SDM", href: "/seniman/permintaan-sdm", icon: <Handshake className="h-4 w-4" /> },
  { label: "Penugasan Sewa", href: "/seniman/penugasan-sewa", icon: <ShoppingBag className="h-4 w-4" /> },
  { label: "Riwayat", href: "/seniman/riwayat", icon: <ScrollText className="h-4 w-4" /> },
  { label: "Sertifikat", href: "/seniman/sertifikat", icon: <Award className="h-4 w-4" /> },
];
const juriNav = [
  { label: "Tugas Penilaian", href: "/juri", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Profil Saya", href: "/juri/profil", icon: <UserCog className="h-4 w-4" /> },
];
const adminNav = [
  { label: "Beranda", href: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
  {
    label: "Konten",
    href: "/admin/berita",
    icon: <Newspaper className="h-4 w-4" />,
    children: [
      { label: "Banner", href: "/admin/banner", icon: <MessageSquare className="h-4 w-4" /> },
      { label: "Slider", href: "/admin/slider", icon: <ImageIcon className="h-4 w-4" /> },
      { label: "Informasi Kebudayaan", href: "/admin/info-budaya", icon: <Landmark className="h-4 w-4" /> },
    ],
  },
];
const sewaNav = [
  { label: "Beranda Katalog", href: "/sewa", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Sanggar", href: "/sewa/katalog/sanggar", icon: <Building2 className="h-4 w-4" /> },
  { label: "SDM", href: "/sewa/katalog/sdm", icon: <Users className="h-4 w-4" /> },
  { label: "Perlengkapan", href: "/sewa/katalog/perlengkapan", icon: <Package className="h-4 w-4" /> },
  { label: "Kostum", href: "/sewa/katalog/kostum", icon: <ShoppingBag className="h-4 w-4" /> },
  { label: "Tempat Latihan", href: "/sewa/katalog/tempat", icon: <Landmark className="h-4 w-4" /> },
  { label: "Pesanan Saya", href: "/sewa/pesanan", icon: <Receipt className="h-4 w-4" /> },
];
const kuratorNav = [
  { label: "Dasbor", href: "/kurator", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Akun Pengguna", href: "/kurator/akun", icon: <Users className="h-4 w-4" /> },
  { label: "Manajemen Data", href: "/kurator/manajemen", icon: <Database className="h-4 w-4" /> },
  { label: "Sistem Kurasi", href: "/kurator/kurasi", icon: <Sliders className="h-4 w-4" /> },
  { label: "Penugasan Juri", href: "/kurator/penugasan", icon: <Trophy className="h-4 w-4" /> },
  { label: "Pengawasan Kerjasama", href: "/kurator/kerjasama", icon: <Handshake className="h-4 w-4" /> },
  { label: "Informasi Kebudayaan", href: "/kurator/info-budaya", icon: <Landmark className="h-4 w-4" /> },
  { label: "Admin & Juri", href: "/kurator/staff", icon: <Shield className="h-4 w-4" /> },
  { label: "Tampilan", href: "/kurator/tampilan", icon: <Palette className="h-4 w-4" /> },
  { label: "Waktu & Sistem", href: "/kurator/waktu", icon: <Clock className="h-4 w-4" /> },
];

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/lupa-password" component={ForgotPassword} />
      <Route path="/daftar" component={RegisterChoice} />
      <Route path="/daftar/sanggar" component={RegisterSanggar} />
      <Route path="/daftar/pelatih" component={RegisterPelatih} />
      <Route path="/daftar/seniman" component={RegisterSeniman} />
      <Route path="/daftar/sewa" component={RegisterSewa} />

      <Route path="/sanggar" >{() => <Guard role="sanggar"><AppShell nav={sanggarNav}><SanggarHome /></AppShell></Guard>}</Route>
      <Route path="/sanggar/profil" >{() => <Guard role="sanggar"><AppShell nav={sanggarNav}><SanggarProfile /></AppShell></Guard>}</Route>
      <Route path="/sanggar/keanggotaan" >{() => <Guard role="sanggar"><AppShell nav={sanggarNav}><Members /></AppShell></Guard>}</Route>
      <Route path="/sanggar/regenerasi" >{() => <Guard role="sanggar"><AppShell nav={sanggarNav}><Regenerasi /></AppShell></Guard>}</Route>
      <Route path="/sanggar/latihan" >{() => <Guard role="sanggar"><AppShell nav={sanggarNav}><LatihanPage /></AppShell></Guard>}</Route>
      <Route path="/sanggar/pembinaan" >{() => <Guard role="sanggar"><AppShell nav={sanggarNav}><Pembinaan /></AppShell></Guard>}</Route>
      <Route path="/sanggar/kurasi" >{() => <Guard role="sanggar"><AppShell nav={sanggarNav}><KurasiPage /></AppShell></Guard>}</Route>
      <Route path="/sanggar/aset" >{() => <Guard role="sanggar"><AppShell nav={sanggarNav}><AsetPage /></AppShell></Guard>}</Route>
      <Route path="/sanggar/sarpras" >{() => <Guard role="sanggar"><AppShell nav={sanggarNav}><SarprasPage /></AppShell></Guard>}</Route>
      <Route path="/sanggar/kerjasama" >{() => <Guard role="sanggar"><AppShell nav={sanggarNav}><KatalogKerjasama /></AppShell></Guard>}</Route>
      <Route path="/sanggar/kerjasama/permintaan" >{() => <Guard role="sanggar"><AppShell nav={sanggarNav}><PermintaanKerjasama /></AppShell></Guard>}</Route>
      <Route path="/sanggar/kerjasama/:id" >{() => <Guard role="sanggar"><AppShell nav={sanggarNav}><KerjasamaDetail /></AppShell></Guard>}</Route>
      <Route path="/sanggar/permintaan-sewa" >{() => <Guard role="sanggar"><AppShell nav={sanggarNav}><PermintaanSewaMasuk /></AppShell></Guard>}</Route>
      <Route path="/sanggar/permintaan-sewa/:id" >{() => <Guard role="sanggar"><AppShell nav={sanggarNav}><PermintaanSewaDetail /></AppShell></Guard>}</Route>
      <Route path="/sanggar/buku-kas" >{() => <Guard role="sanggar"><AppShell nav={sanggarNav}><BukuKas /></AppShell></Guard>}</Route>

      <Route path="/pelatih" >{() => <Guard role="pelatih"><AppShell nav={pelatihNav}><PelatihHome /></AppShell></Guard>}</Route>
      <Route path="/pelatih/daftar-latih" >{() => <Guard role="pelatih"><AppShell nav={pelatihNav}><PelatihDaftarLatih /></AppShell></Guard>}</Route>
      <Route path="/pelatih/honor" >{() => <Guard role="pelatih"><AppShell nav={pelatihNav}><PelatihHonor /></AppShell></Guard>}</Route>
      <Route path="/pelatih/slip" >{() => <Guard role="pelatih"><AppShell nav={pelatihNav}><PelatihSlip /></AppShell></Guard>}</Route>
      <Route path="/pelatih/honor-proyek" >{() => <Guard role="pelatih"><AppShell nav={pelatihNav}><PelatihDistribusi /></AppShell></Guard>}</Route>
      <Route path="/pelatih/permintaan-sdm" >{() => <Guard role="pelatih"><AppShell nav={pelatihNav}><PermintaanSdmReadOnly /></AppShell></Guard>}</Route>
      <Route path="/pelatih/penugasan-sewa" >{() => <Guard role="pelatih"><AppShell nav={pelatihNav}><PenugasanSewaInbox /></AppShell></Guard>}</Route>
      <Route path="/pelatih/penugasan-sewa/:id" >{() => <Guard role="pelatih"><AppShell nav={pelatihNav}><PenugasanSewaDetail /></AppShell></Guard>}</Route>
      <Route path="/pelatih/sertifikat" >{() => <Guard role="pelatih"><AppShell nav={pelatihNav}><PelatihSertif /></AppShell></Guard>}</Route>

      <Route path="/seniman" >{() => <Guard role="seniman"><AppShell nav={senimanNav}><SenimanHome /></AppShell></Guard>}</Route>
      <Route path="/seniman/profil" >{() => <Guard role="seniman"><AppShell nav={senimanNav}><SenimanProfile /></AppShell></Guard>}</Route>
      <Route path="/seniman/keuangan" >{() => <Guard role="seniman"><Redirect to="/seniman/tagihan" /></Guard>}</Route>
      <Route path="/seniman/tagihan" >{() => <Guard role="seniman"><AppShell nav={senimanNav}><SenimanTagihan /></AppShell></Guard>}</Route>
      <Route path="/seniman/honor-komersial" >{() => <Guard role="seniman"><AppShell nav={senimanNav}><PelatihDistribusi /></AppShell></Guard>}</Route>
      <Route path="/seniman/riwayat" >{() => <Guard role="seniman"><AppShell nav={senimanNav}><SenimanRiwayat /></AppShell></Guard>}</Route>
      <Route path="/seniman/permintaan-sdm" >{() => <Guard role="seniman"><AppShell nav={senimanNav}><PermintaanSdmReadOnly /></AppShell></Guard>}</Route>
      <Route path="/seniman/penugasan-sewa" >{() => <Guard role="seniman"><AppShell nav={senimanNav}><PenugasanSewaInbox /></AppShell></Guard>}</Route>
      <Route path="/seniman/penugasan-sewa/:id" >{() => <Guard role="seniman"><AppShell nav={senimanNav}><PenugasanSewaDetail /></AppShell></Guard>}</Route>
      <Route path="/seniman/sertifikat" >{() => <Guard role="seniman"><AppShell nav={senimanNav}><PelatihSertif /></AppShell></Guard>}</Route>

      <Route path="/juri" >{() => <Guard role="juri"><AppShell nav={juriNav}><JuriHome /></AppShell></Guard>}</Route>
      <Route path="/juri/profil" >{() => <Guard role="juri"><AppShell nav={juriNav}><JuriProfile /></AppShell></Guard>}</Route>
      <Route path="/juri/:id" >{() => <Guard role="juri"><AppShell nav={juriNav}><JuriScoring /></AppShell></Guard>}</Route>

      <Route path="/admin" >{() => <Guard role="admin"><AppShell nav={adminNav}><AdminHome /></AppShell></Guard>}</Route>
      <Route path="/admin/berita" >{() => <Guard role="admin"><AppShell nav={adminNav}><AdminBerita /></AppShell></Guard>}</Route>
      <Route path="/admin/banner" >{() => <Guard role="admin"><AppShell nav={adminNav}><AdminBanner /></AppShell></Guard>}</Route>
      <Route path="/admin/slider" >{() => <Guard role="admin"><AppShell nav={adminNav}><AdminSlider /></AppShell></Guard>}</Route>
      <Route path="/admin/info-budaya" >{() => <Guard role="admin"><AppShell nav={adminNav}><InfoBudayaManager audience="admin" /></AppShell></Guard>}</Route>

      <Route path="/kurator" >{() => <Guard role="kurator"><AppShell nav={kuratorNav}><KuratorHome /></AppShell></Guard>}</Route>
      <Route path="/kurator/akun" >{() => <Guard role="kurator"><AppShell nav={kuratorNav}><KuratorAccounts /></AppShell></Guard>}</Route>
      <Route path="/kurator/manajemen" >{() => <Guard role="kurator"><AppShell nav={kuratorNav}><KuratorManajemenData /></AppShell></Guard>}</Route>
      <Route path="/kurator/kurasi" >{() => <Guard role="kurator"><AppShell nav={kuratorNav}><KuratorMatriks /></AppShell></Guard>}</Route>
      <Route path="/kurator/penugasan" >{() => <Guard role="kurator"><AppShell nav={kuratorNav}><KuratorAssign /></AppShell></Guard>}</Route>
      <Route path="/kurator/kerjasama" >{() => <Guard role="kurator"><AppShell nav={kuratorNav}><KuratorKerjasama /></AppShell></Guard>}</Route>
      <Route path="/kurator/info-budaya" >{() => <Guard role="kurator"><AppShell nav={kuratorNav}><InfoBudayaManager audience="kurator" /></AppShell></Guard>}</Route>
      <Route path="/kurator/staff" >{() => <Guard role="kurator"><AppShell nav={kuratorNav}><KuratorStaff /></AppShell></Guard>}</Route>
      <Route path="/kurator/tampilan" >{() => <Guard role="kurator"><AppShell nav={kuratorNav}><KuratorAppearance /></AppShell></Guard>}</Route>
      <Route path="/kurator/waktu" >{() => <Guard role="kurator"><AppShell nav={kuratorNav}><KuratorWaktu /></AppShell></Guard>}</Route>

      <Route path="/sewa" >{() => <Guard role="sewa"><AppShell nav={sewaNav}><SewaHome /></AppShell></Guard>}</Route>
      <Route path="/sewa/katalog/:kategori" >{() => <Guard role="sewa"><AppShell nav={sewaNav}><SewaKatalog /></AppShell></Guard>}</Route>
      <Route path="/sewa/item/:id" >{() => <Guard role="sewa"><AppShell nav={sewaNav}><SewaItemDetail /></AppShell></Guard>}</Route>
      <Route path="/sewa/pesanan" >{() => <Guard role="sewa"><AppShell nav={sewaNav}><SewaPesananList /></AppShell></Guard>}</Route>
      <Route path="/sewa/pesanan/:id" >{() => <Guard role="sewa"><AppShell nav={sewaNav}><SewaPesananDetail /></AppShell></Guard>}</Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <TradisiLisanProvider />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
