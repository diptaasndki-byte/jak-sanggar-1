import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

type Kategori = "Pantun Betawi" | "Peribahasa" | "Palang Pintu" | "Sahibul Hikayat" | "Cerita Rakyat" | "Salam Betawi" | "Rancag" | "Lenong";

interface Tradisi { kategori: Kategori; judul: string; isi: string; sumber?: string; }

const POOL: Tradisi[] = [
  // Pantun Betawi
  { kategori: "Pantun Betawi", judul: "Pantun Sanggar", isi: "Anak Betawi menabuh rebana,\nIramanya merdu di kala senja.\nKlik tombolmu penuh makna,\nJak Sanggar siap bekerja." },
  { kategori: "Pantun Betawi", judul: "Pantun Klik", isi: "Pergi ke pasar membeli kain,\nKain batik corak melati.\nSetiap karya seniman lain,\nMenyatu indah di sanggar ini." },
  { kategori: "Pantun Betawi", judul: "Pantun Honor", isi: "Ke Monas sore naik bajaj,\nLewat Sudirman macetnya panjang.\nHonor cair tepat di hari gajian,\nHati tenang kerja pun lapang." },
  { kategori: "Pantun Betawi", judul: "Pantun Latihan", isi: "Ondel-ondel berjalan beriring,\nMengikuti irama gendang pengantin.\nLatihan rutin jangan dimiringin,\nBakat tumbuh menjadi terlatih." },
  { kategori: "Pantun Betawi", judul: "Pantun Tari Topeng", isi: "Kembang kelapa dipasang tinggi,\nMenghias panggung di hari raya.\nTari Betawi penuh berseri,\nMelestarikan budaya pusaka." },

  // Peribahasa Betawi
  { kategori: "Peribahasa", judul: "Tau Diri", isi: "“Aer beriak tande tak dalem,\naer tenang bukan berarti gak ade ikannye.”", sumber: "Peribahasa Betawi" },
  { kategori: "Peribahasa", judul: "Kerja Bareng", isi: "“Berate same dipikul,\nringen same dijinjing.”", sumber: "Peribahasa Betawi" },
  { kategori: "Peribahasa", judul: "Hemat", isi: "“Hemat pangkel kaye,\nrajin pangkel pinter.”", sumber: "Petitih Betawi" },
  { kategori: "Peribahasa", judul: "Sopan Santun", isi: "“Kalo ngomong kudu pake ati,\nkalo ketawe jangan lupe diri.”", sumber: "Peribahasa Betawi" },
  { kategori: "Peribahasa", judul: "Kebersamaan", isi: "“Same-same ngerasain pait,\nsame-same nikmatin manis.”", sumber: "Peribahasa Betawi" },

  // Palang Pintu (rhymed verbal duel from Betawi weddings)
  { kategori: "Palang Pintu", judul: "Sambutan Tamu", isi: "Bang, lewat sini kudu permisi,\nrumah kami punye aturan.\nKlik tombolnye dengen hati,\nbiar berkah dapet sambutan.", sumber: "Buka Palang Pintu" },
  { kategori: "Palang Pintu", judul: "Tantangan Halus", isi: "Burung kuthilang di atas dahan,\nbersuara nyaring sebelum subuh.\nKalo emang punya kemampuan,\nlanjutin terus jangan berkeluh.", sumber: "Buka Palang Pintu" },
  { kategori: "Palang Pintu", judul: "Salam Hormat", isi: "Assalamualaikum kami ucapkan,\nsalam hormat penuh ketulusan.\nDi sanggar ini kite kerjakan,\namanat budaye jadi pusaka warisan.", sumber: "Buka Palang Pintu" },

  // Sahibul Hikayat (storytelling tradition)
  { kategori: "Sahibul Hikayat", judul: "Pembuka Cerita", isi: "“Pade jaman dahulu kale,\ndi tanah Betawi nan permai…”\nBegitulah tukang cerite mulai,\nmenuturkan hikayat yang ramai.", sumber: "Tradisi Sahibul Hikayat" },
  { kategori: "Sahibul Hikayat", judul: "Pesan Tetua", isi: "“Anak muda, dengerin baek-baek,\nilmu itu bukan sekadar tau.\nDikerjain baru jadi berkat,\nbukan cuman omongan doang lho.”", sumber: "Tutur Tetua Betawi" },
  { kategori: "Sahibul Hikayat", judul: "Penutup Hikayat", isi: "“Demikianlah cerite ini berakhir,\nambil hikmahnye buat bekal.\nYang baek dipegang kuat-kuat,\nyang buruk dibuang jangan kekal.”", sumber: "Tradisi Sahibul Hikayat" },

  // Cerita Rakyat
  { kategori: "Cerita Rakyat", judul: "Si Pitung", isi: "Si Pitung jago dari Rawabelong,\nbela rakyat kecil tanpa pamrih.\nSemangatnye hidup terus tertolong,\nbiar generasi muda gak letih.", sumber: "Legende Si Pitung" },
  { kategori: "Cerita Rakyat", judul: "Nyai Dasimah", isi: "Nyai Dasimah cantik jelita,\nkisahnye masyhur sampe sekarang.\nDari die kite belajar nyate,\npilihan hidup mesti dipikir matang.", sumber: "Legende Betawi" },
  { kategori: "Cerita Rakyat", judul: "Mirah dari Marunda", isi: "Mirah jago silat dari Marunda,\nperempuan Betawi yang berani.\nKarya budaye kudu dijaga,\nbiar tetep idup di hati nurani.", sumber: "Legende Betawi" },

  // Salam Betawi
  { kategori: "Salam Betawi", judul: "Salam Akrab", isi: "“Eh, ape kabar ente, Bang?\nMudah-mudahan sehat selalu ye.\nDi sanggar ini kite berjuang,\nlestariin seni jakartanye.”", sumber: "Ungkapan Sehari-hari" },
  { kategori: "Salam Betawi", judul: "Doa Mulai Kerja", isi: "“Bismillah, mulai kerja kite,\nmoga lancar gak ade halangan.\nNiat lurus ati senang,\nrejeki dateng dari Tuhan.”", sumber: "Doa Sederhana Betawi" },
  { kategori: "Salam Betawi", judul: "Pamit", isi: "“Mari Bang, ane permisi dulu,\nente terusin kerjaan ente.\nNanti kalo ade kabar baru,\nente kabarin ane lewat sini.”", sumber: "Ungkapan Pamit" },

  // Rancag (sung rhyming verse, classic Betawi)
  { kategori: "Rancag", judul: "Rancag Pembuka", isi: "Anak Jakarta naik MRT,\nturun di Bunderan HI yang ramai.\nKalo udah niat jadi seniman sejati,\njangan setengah-setengah ye, sampe rampung sampai.", sumber: "Rancag Tradisi Betawi" },
  { kategori: "Rancag", judul: "Rancag Tekun", isi: "Burung dare terbang berdua,\nhinggap sebentar di pucuk pohon kelape.\nTekun belajar jangan ade dua,\nfokus satu biar berkah doanye.", sumber: "Rancag Tradisi Betawi" },
  { kategori: "Rancag", judul: "Rancag Syukur", isi: "Hujan rintik di Kota Tua,\npayung warna-warni meneduhi jalan.\nApe yang ade tetap disyukuri,\nrejeki dikit tetep berkah pamungkas.", sumber: "Rancag Tradisi Betawi" },

  // Lenong (theater dialogue)
  { kategori: "Lenong", judul: "Dialog Lenong", isi: "“Bang Jampang, ngapain lo bengong?”\n“Nih Mpok, gue lagi mikirin Sanggar.”\n“Pikirin yang bener dong, jangan ngelong,\nbiar Jak Sanggar makin gencar.”", sumber: "Lenong Denes" },
  { kategori: "Lenong", judul: "Lawakan Lenong", isi: "“Mpok, kenape klik tombolnye lame banget?”\n“Sabar Bang, namenye juga teknologi.”\n“Ye kalo gini terus, tuker hape ane gadget!”\n“Eh udah, klik aje terus, nanti juge jalan sendiri.”", sumber: "Lenong Preman" },
];

const COOLDOWN_MS = 2200;
const AUTO_HIDE_MS = 4200;

const KATEGORI_COLOR: Record<Kategori, string> = {
  "Pantun Betawi": "#e3b864",
  "Peribahasa": "#d4a64e",
  "Palang Pintu": "#c2784a",
  "Sahibul Hikayat": "#b89460",
  "Cerita Rakyat": "#c45a72",
  "Salam Betawi": "#caa86a",
  "Rancag": "#daa44e",
  "Lenong": "#9d7bc0",
};

export function TradisiLisanProvider() {
  const [active, setActive] = useState<Tradisi | null>(null);
  const [tick, setTick] = useState(0);
  const lastShownRef = useRef<number>(0);
  const lastIndexRef = useRef<number>(-1);
  const hideTimerRef = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    setActive(null);
    if (hideTimerRef.current) { window.clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.closest('[data-tradisi-popup="root"]')) return;

      const btn = target.closest<HTMLElement>(
        'button, [role="button"], a[href], [data-tradisi="trigger"]'
      );
      if (!btn) return;
      if (btn.closest('[data-tradisi="silent"]')) return;
      if (btn.getAttribute("aria-disabled") === "true" || (btn as HTMLButtonElement).disabled) return;

      const now = Date.now();
      if (now - lastShownRef.current < COOLDOWN_MS) return;
      lastShownRef.current = now;

      let idx = Math.floor(Math.random() * POOL.length);
      if (idx === lastIndexRef.current) idx = (idx + 1) % POOL.length;
      lastIndexRef.current = idx;

      setActive(POOL[idx]);
      setTick(t => t + 1);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => setActive(null), AUTO_HIDE_MS);
    };

    document.addEventListener("click", handler, true);
    return () => {
      document.removeEventListener("click", handler, true);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  return (
    <div data-tradisi-popup="root" className="pointer-events-none fixed right-0 bottom-0 z-[60] p-3 sm:p-4">
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={tick}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 360, damping: 30, mass: 0.7 }}
            className="pointer-events-auto w-[260px] sm:w-[280px]"
          >
            <Card item={active} onClose={dismiss} progressKey={tick} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Card({ item, onClose, progressKey }: { item: Tradisi; onClose: () => void; progressKey: number }) {
  const accent = KATEGORI_COLOR[item.kategori];

  return (
    <div
      className="group relative overflow-hidden rounded-xl backdrop-blur-md border"
      style={{
        background: "linear-gradient(140deg, hsl(222 60% 10% / 0.92) 0%, hsl(222 55% 14% / 0.92) 60%, hsl(268 40% 18% / 0.93) 100%)",
        borderColor: `${accent}55`,
        boxShadow: `0 12px 30px -10px rgba(0,0,0,0.5), 0 0 0 1px ${accent}1a, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

      <button
        type="button"
        onClick={onClose}
        data-tradisi="silent"
        aria-label="Tutup"
        className="absolute right-1.5 top-1.5 grid place-items-center h-5 w-5 rounded-full text-amber-100/40 opacity-0 group-hover:opacity-100 hover:text-amber-100 hover:bg-white/10 transition z-10"
      >
        <X className="h-3 w-3" />
      </button>

      <div className="px-3.5 pt-3 pb-1 flex items-center gap-1.5">
        <span
          className="inline-flex items-center gap-1 text-[8.5px] font-semibold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full"
          style={{ background: `${accent}1f`, color: accent, border: `1px solid ${accent}44` }}
        >
          <span className="h-[3px] w-[3px] rounded-full" style={{ background: accent }} />
          {item.kategori}
        </span>
      </div>

      <div className="px-3.5 pb-0.5">
        <h3 className="font-serif text-[13px] leading-tight text-amber-50/95">{item.judul}</h3>
      </div>

      <div className="px-3.5 pb-3 pt-1">
        <p className="font-serif italic text-[11.5px] leading-[1.55] text-amber-50/85 whitespace-pre-line line-clamp-4">
          {item.isi}
        </p>
        {item.sumber && (
          <div className="mt-1.5 text-[8.5px] uppercase tracking-[0.14em] text-amber-100/40 text-right">
            — {item.sumber}
          </div>
        )}
      </div>

      <div className="h-[2px] w-full bg-white/5">
        <motion.div
          key={`bar-${progressKey}`}
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: AUTO_HIDE_MS / 1000, ease: "linear" }}
          className="h-full"
          style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }}
        />
      </div>
    </div>
  );
}
