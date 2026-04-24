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

const COOLDOWN_MS = 700;
const AUTO_HIDE_MS = 6500;

const KATEGORI_COLOR: Record<Kategori, string> = {
  "Pantun Betawi": "#d4a64e",
  "Peribahasa": "#c97a4a",
  "Palang Pintu": "#b8443c",
  "Sahibul Hikayat": "#9c6b3f",
  "Cerita Rakyat": "#8b3a52",
  "Salam Betawi": "#a8763e",
  "Rancag": "#c19146",
  "Lenong": "#7c4a8e",
};

function BatikOrnament({ color = "currentColor" }: { color?: string }) {
  return (
    <svg viewBox="0 0 200 14" className="w-full h-3.5" preserveAspectRatio="none" aria-hidden>
      <g fill={color} opacity="0.85">
        <circle cx="6" cy="7" r="1.5" />
        <path d="M14 7 Q20 0 26 7 Q20 14 14 7 Z" />
        <circle cx="34" cy="7" r="1.5" />
        <path d="M44 4 L48 7 L44 10 L40 7 Z" />
        <circle cx="56" cy="7" r="1.5" />
        <path d="M64 7 Q72 1 80 7 Q72 13 64 7 Z" />
        <circle cx="88" cy="7" r="2.4" />
        <circle cx="88" cy="7" r="0.9" fill="hsl(var(--background))" />
        <path d="M100 7 Q108 1 116 7 Q108 13 100 7 Z" />
        <circle cx="124" cy="7" r="1.5" />
        <path d="M134 4 L138 7 L134 10 L130 7 Z" />
        <circle cx="146" cy="7" r="1.5" />
        <path d="M156 7 Q162 0 168 7 Q162 14 156 7 Z" />
        <circle cx="176" cy="7" r="1.5" />
        <path d="M184 4 L188 7 L184 10 L180 7 Z" />
        <circle cx="196" cy="7" r="1.5" />
      </g>
    </svg>
  );
}

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
    <div data-tradisi-popup="root" className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center sm:justify-end p-4 sm:p-6">
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={tick}
            initial={{ opacity: 0, y: 36, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.8 }}
            className="pointer-events-auto w-full max-w-md"
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
      className="relative overflow-hidden rounded-2xl shadow-2xl backdrop-blur-md border"
      style={{
        background: "linear-gradient(140deg, hsl(25 25% 12% / 0.96) 0%, hsl(15 35% 18% / 0.96) 60%, hsl(25 25% 10% / 0.97) 100%)",
        borderColor: `${accent}66`,
        boxShadow: `0 25px 50px -10px rgba(0,0,0,0.6), 0 0 0 1px ${accent}22, inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

      <button
        type="button"
        onClick={onClose}
        data-tradisi="silent"
        aria-label="Tutup"
        className="absolute right-3 top-3 grid place-items-center h-7 w-7 rounded-full text-amber-100/60 hover:text-amber-100 hover:bg-white/10 transition z-10"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="px-6 pt-5 pb-2 flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full"
          style={{ background: `${accent}26`, color: accent, border: `1px solid ${accent}55` }}
        >
          <span className="h-1 w-1 rounded-full" style={{ background: accent }} />
          {item.kategori}
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-amber-100/40">Tradisi Lisan Betawi</span>
      </div>

      <div className="px-6 pt-1 pb-1">
        <h3 className="font-serif text-[20px] leading-tight text-amber-50">{item.judul}</h3>
      </div>

      <div className="px-6 py-2 text-amber-100/40">
        <BatikOrnament color={accent} />
      </div>

      <div className="px-6 pb-5">
        <p className="font-serif italic text-[15px] leading-[1.7] text-amber-50/95 whitespace-pre-line">
          {item.isi}
        </p>
        {item.sumber && (
          <div className="mt-3 text-[11px] uppercase tracking-[0.16em] text-amber-100/45 text-right">
            — {item.sumber}
          </div>
        )}
      </div>

      <div className="h-[3px] w-full bg-white/5">
        <motion.div
          key={`bar-${progressKey}`}
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: AUTO_HIDE_MS / 1000, ease: "linear" }}
          className="h-full"
          style={{ background: `linear-gradient(90deg, ${accent}, ${accent}99)` }}
        />
      </div>
    </div>
  );
}
