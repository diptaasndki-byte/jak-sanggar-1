import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const PANTUN: Array<{ judul: string; isi: string }> = [
  { judul: "Pantun Sanggar", isi: "Anak Betawi menabuh rebana,\nIramanya merdu di kala senja.\nKlik tombolmu penuh makna,\nJak Sanggar siap bekerja." },
  { judul: "Pantun Kesenian", isi: "Pergi ke pasar membeli kain,\nKain batik corak melati.\nSetiap karya seniman lain,\nMenyatu indah di sanggar ini." },
  { judul: "Pantun Pelatih", isi: "Burung dara terbang berdua,\nHinggap sebentar di atas tiang.\nPelatih sabar mengajar semua,\nMurid pintar hatinya senang." },
  { judul: "Pantun Honor", isi: "Ke Monas sore naik bajaj,\nLewat Sudirman macetnya panjang.\nHonor cair tepat di hari gajian,\nHati tenang kerja pun lapang." },
  { judul: "Pantun Latihan", isi: "Ondel-ondel berjalan beriring,\nMengikuti irama gendang pengantin.\nLatihan rutin jangan dimiring,\nBakat tumbuh menjadi terlatih." },
  { judul: "Pantun Tari", isi: "Kembang kelapa dipasang tinggi,\nMenghias panggung di hari raya.\nTari Betawi penuh berseri,\nMelestarikan budaya pusaka." },
  { judul: "Pantun Kurasi", isi: "Tukang sate keliling kampung,\nMemanggil pembeli suaranya nyaring.\nKurasi datang membawa untung,\nSanggar terbaik akan diiring." },
  { judul: "Pantun Juri", isi: "Orang Betawi makan nasi uduk,\nDitambah semur jengkol kesukaan.\nJuri menilai tidak main-main duduk,\nObjektif sesuai indikator pilihan." },
  { judul: "Pantun Iuran", isi: "Naik delman ke Pasar Senen,\nMembeli kerupuk dan dodol garut.\nIuran lunas hati senang,\nKas sanggar pun ikut tersulut." },
  { judul: "Pantun Profil", isi: "Di Kemang ada warung kopi,\nHarum aromanya sampai ke jalan.\nProfilmu rapi dan terisi,\nIdentitas jelas semua kebagian." },
  { judul: "Pantun Galeri", isi: "Anak Jakarta naik MRT,\nTurun di Bundaran HI yang ramai.\nFoto galeri jadi bukti,\nKarya sanggar dikenang sampai." },
  { judul: "Pantun Sertifikat", isi: "Ke Setu Babakan jalan-jalan,\nMelihat rumah adat Betawi tua.\nSertifikat tanda penghargaan,\nBukti kerja keras yang nyata." },
  { judul: "Pantun Pembinaan", isi: "Hujan rintik di Kota Tua,\nPayung warna-warni meneduhi.\nPembinaan rutin setiap hari,\nMembentuk seniman yang sejati." },
  { judul: "Pantun Regenerasi", isi: "Pohon kelapa tumbuh tinggi,\nTunas baru muncul di sisinya.\nRegenerasi harus terjadi,\nAgar sanggar tetap berjaya." },
  { judul: "Pantun Klik", isi: "Burung pipit terbang ke barat,\nHinggap sejenak di atas atap.\nSetiap klikmu kuingat,\nLayanan kami tetap siap tanggap." },
  { judul: "Pantun Simpan", isi: "Pak Sopir membawa angkot,\nJalanan macet tetap sabar.\nData tersimpan tidak melompot,\nAman tersusun rapi dan benar." },
  { judul: "Pantun Validasi", isi: "Beli rujak di pinggir kali,\nRasanya pedas bikin kepedasan.\nValidasi dijalankan teliti,\nTidak ada celah untuk kesalahan." },
  { judul: "Pantun Kas", isi: "Anak sekolah pergi ke pasar,\nMembeli buku dan pena baru.\nBuku kas selalu dijaga jelas,\nLaporan keuangan tidak keliru." },
  { judul: "Pantun Banner", isi: "Layang-layang naik ke awan,\nBenangnya panjang dipegang erat.\nBanner terpasang jadi sambutan,\nPengunjung datang tertarik melihat." },
  { judul: "Pantun Berita", isi: "Air kali mengalir deras,\nMembawa kabar dari hulu sungai.\nBerita baru selalu lekas,\nDibagi cepat tanpa bercabang." },
  { judul: "Pantun Distribusi", isi: "Ondel-ondel beriring jalan,\nMengelilingi gang demi gang.\nHonor proyek dibagi rata,\nSemua penerima merasa senang." },
  { judul: "Pantun Akun", isi: "Hujan reda matahari muncul,\nLangit Jakarta cerah berseri.\nAkun aktif sudah terdaftar,\nLayanan penuh kini diberi." },
  { judul: "Pantun Login", isi: "Ke Glodok membeli teh,\nDicampur jeruk segar rasanya.\nLogin sukses bergegas geleh,\nSelamat datang di rumah seni Jakarta." },
  { judul: "Pantun Logout", isi: "Sore tiba di Pelabuhan Sunda,\nKapal merapat membawa muatan.\nKeluar sejenak tetap bertahta,\nBesok kembali penuh harapan." },
];

const COOLDOWN_MS = 700;

export function PantunListener() {
  const { toast } = useToast();
  const lastShownRef = useRef<number>(0);
  const lastIndexRef = useRef<number>(-1);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const btn = target.closest<HTMLElement>(
        'button, [role="button"], a[href], [data-pantun="trigger"]'
      );
      if (!btn) return;

      if (btn.closest('[data-pantun="silent"]')) return;
      if (btn.getAttribute("aria-disabled") === "true" || (btn as HTMLButtonElement).disabled) return;

      const now = Date.now();
      if (now - lastShownRef.current < COOLDOWN_MS) return;
      lastShownRef.current = now;

      let idx = Math.floor(Math.random() * PANTUN.length);
      if (idx === lastIndexRef.current) idx = (idx + 1) % PANTUN.length;
      lastIndexRef.current = idx;
      const p = PANTUN[idx];

      toast({
        title: p.judul,
        description: (
          <span style={{ whiteSpace: "pre-line", fontStyle: "italic", lineHeight: 1.5 }}>
            {p.isi}
          </span>
        ) as any,
      });
    };

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [toast]);

  return null;
}
