import { useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useAuth, useDb } from "@/lib/auth";
import { fmtRp } from "@/lib/store";
import { buildKatalog, SATUAN_LABEL, type KatalogItem } from "@/lib/kerjasama";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2, Users as UsersIcon, Music2, Shirt, MapPin, Search,
  Sparkles, ArrowRight, ShoppingBag,
} from "lucide-react";
import type { JenisKesenian, SewaUser } from "@/lib/types";

type Kategori = "sanggar" | "sdm" | "perlengkapan" | "kostum" | "tempat";

const KATEGORI_META: Record<Kategori, { label: string; desc: string; icon: React.ReactNode; tone: string }> = {
  sanggar: {
    label: "Sanggar",
    desc: "Daftar sanggar yang siap menerima permintaan kolaborasi atau pertunjukan.",
    icon: <Building2 className="h-7 w-7" />,
    tone: "from-primary/15 to-primary/5 text-primary",
  },
  sdm: {
    label: "SDM",
    desc: "Pelatih dan seniman yang dapat dipesan untuk mengisi acara.",
    icon: <UsersIcon className="h-7 w-7" />,
    tone: "from-amber-500/20 to-amber-500/5 text-amber-700 dark:text-amber-300",
  },
  perlengkapan: {
    label: "Perlengkapan",
    desc: "Alat musik dan perlengkapan pentas yang bisa disewa.",
    icon: <Music2 className="h-7 w-7" />,
    tone: "from-emerald-500/15 to-emerald-500/5 text-emerald-700 dark:text-emerald-300",
  },
  kostum: {
    label: "Kostum",
    desc: "Kostum tradisional siap pakai untuk acara dan pertunjukan.",
    icon: <Shirt className="h-7 w-7" />,
    tone: "from-rose-500/15 to-rose-500/5 text-rose-700 dark:text-rose-300",
  },
  tempat: {
    label: "Tempat Latihan",
    desc: "Aula, studio, dan tempat latihan beserta fasilitasnya.",
    icon: <MapPin className="h-7 w-7" />,
    tone: "from-sky-500/15 to-sky-500/5 text-sky-700 dark:text-sky-300",
  },
};

const KATEGORI_LIST: Kategori[] = ["sanggar", "sdm", "perlengkapan", "kostum", "tempat"];
const KESENIAN_OPTIONS: JenisKesenian[] = ["Tari", "Musik", "Teater", "Rupa", "Sastra", "Silat"];

export function SewaHome() {
  const { user } = useAuth();
  const db = useDb();
  if (!user || user.role !== "sewa") return null;
  const sewa = user as SewaUser;

  // Hitung jumlah item per kategori untuk preview di kartu.
  const items = useMemo(() => buildKatalog(), [db.users, db.aset, db.sarpras]);
  const sanggarCount = useMemo(
    () => db.users.filter(u => u.role === "sanggar").length,
    [db.users],
  );
  const counts: Record<Kategori, number> = {
    sanggar: sanggarCount,
    sdm: items.filter(i => i.kategori === "sdm").length,
    perlengkapan: items.filter(i => i.kategori === "alat_musik").length,
    kostum: items.filter(i => i.kategori === "kostum").length,
    tempat: items.filter(i => i.kategori === "tempat_latihan").length,
  };

  return (
    <div>
      <PageHeader
        title={`Selamat datang, ${sewa.nama}`}
        subtitle="Telusuri katalog jasa kesenian dari sanggar-sanggar Jakarta. Klik kategori untuk membuka katalog lengkap dengan filter dan pencarian."
        back={false}
      />

      <Card className="p-4 mb-6 bg-gradient-to-br from-primary/10 via-amber-500/10 to-transparent border-primary/20">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 text-primary grid place-items-center shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="text-sm">
            <div className="font-medium">Mode penyewa jasa</div>
            <p className="text-muted-foreground mt-0.5">
              Anda dapat mencari, memfilter, dan melihat detail layanan. Untuk memesan,
              silakan hubungi sanggar lewat kontak yang tertera atau koordinasikan lewat kurator.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {KATEGORI_LIST.map(k => {
          const meta = KATEGORI_META[k];
          return (
            <Link key={k} href={`/sewa/katalog/${k}`}>
              <Card
                className={`p-5 cursor-pointer hover-elevate active-elevate-2 transition-all h-full bg-gradient-to-br ${meta.tone}`}
                data-testid={`card-kategori-${k}`}
              >
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 rounded-xl bg-white/40 dark:bg-black/20 grid place-items-center backdrop-blur">
                    {meta.icon}
                  </div>
                  <Badge variant="secondary" className="text-xs">{counts[k]} item</Badge>
                </div>
                <div className="mt-4 font-serif text-xl text-foreground">{meta.label}</div>
                <p className="mt-1 text-sm text-foreground/70 line-clamp-2">{meta.desc}</p>
                <div className="mt-4 flex items-center text-sm font-medium">
                  Buka katalog <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function isKategori(v: string | undefined): v is Kategori {
  return !!v && (KATEGORI_LIST as string[]).includes(v);
}

export function SewaKatalog() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/sewa/katalog/:kategori");
  const db = useDb();

  const kategoriParam = match ? params?.kategori : undefined;
  const kategori: Kategori = isKategori(kategoriParam) ? kategoriParam : "sanggar";

  const [q, setQ] = useState("");
  const [filterKesenian, setFilterKesenian] = useState<"all" | JenisKesenian>("all");
  const [filterSanggar, setFilterSanggar] = useState<"all" | string>("all");
  const [hargaMin, setHargaMin] = useState("");
  const [hargaMax, setHargaMax] = useState("");

  const sanggarList = useMemo(
    () => db.users.filter(u => u.role === "sanggar") as Array<{ id: string; namaSanggar: string }>,
    [db.users],
  );

  const items = useMemo(() => buildKatalog(), [db.users, db.aset, db.sarpras]);

  if (!user || user.role !== "sewa") return null;

  // Mapping kategori UI → kategori internal KatalogItem.
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const min = hargaMin ? Number(hargaMin) : null;
    const max = hargaMax ? Number(hargaMax) : null;

    if (kategori === "sanggar") {
      // Untuk kategori "sanggar" tampilkan langsung daftar sanggar.
      const sanggars = (db.users.filter(u => u.role === "sanggar") as any[]).map(s => ({
        id: s.id,
        nama: s.namaSanggar as string,
        alamat: (s.alamat ?? "-") as string,
        jenisKesenian: (s.jenisKesenian ?? []) as JenisKesenian[],
        deskripsi: (s.deskripsi ?? "") as string,
        foto: s.fotoProfileDataUrl as string | undefined,
        noHp: s.noHp as string | undefined,
        email: s.email as string | undefined,
      }));
      return sanggars.filter(s => {
        if (term && !`${s.nama} ${s.alamat} ${s.deskripsi}`.toLowerCase().includes(term)) return false;
        if (filterSanggar !== "all" && s.id !== filterSanggar) return false;
        if (filterKesenian !== "all" && !s.jenisKesenian.includes(filterKesenian)) return false;
        return true;
      });
    }

    const internalKat =
      kategori === "sdm" ? "sdm"
      : kategori === "perlengkapan" ? "alat_musik"
      : kategori === "kostum" ? "kostum"
      : "tempat_latihan";
    return items.filter((i: KatalogItem) => {
      if (i.kategori !== internalKat) return false;
      if (term) {
        const hay = `${i.judul} ${i.sanggarNama} ${i.deskripsi} ${i.namaSdm ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (filterSanggar !== "all" && i.sanggarId !== filterSanggar) return false;
      if (filterKesenian !== "all" && !i.jenisKesenian.includes(filterKesenian)) return false;
      if (min !== null && i.hargaSewa < min) return false;
      if (max !== null && i.hargaSewa > max) return false;
      return true;
    });
  }, [items, db.users, q, kategori, filterKesenian, filterSanggar, hargaMin, hargaMax]);

  const meta = KATEGORI_META[kategori];

  return (
    <div>
      <PageHeader
        title={`Katalog ${meta.label}`}
        subtitle={meta.desc}
        backTo="/sewa"
        actions={
          <div className="flex gap-2">
            {KATEGORI_LIST.map(k => (
              <Button
                key={k}
                size="sm"
                variant={k === kategori ? "default" : "outline"}
                onClick={() => navigate(`/sewa/katalog/${k}`)}
                data-testid={`button-tab-${k}`}
              >
                {KATEGORI_META[k].label}
              </Button>
            ))}
          </div>
        }
      />

      <Card className="p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <Label className="text-xs">Pencarian</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder={
                  kategori === "sdm" ? "Cari nama seniman / pelatih..."
                  : kategori === "sanggar" ? "Cari nama sanggar / alamat..."
                  : "Cari nama / sanggar / fasilitas..."
                }
                className="pl-8"
                data-testid="input-search"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Jenis Kesenian</Label>
            <Select value={filterKesenian} onValueChange={(v) => setFilterKesenian(v as typeof filterKesenian)}>
              <SelectTrigger data-testid="select-kesenian"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {KESENIAN_OPTIONS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Sanggar</Label>
            <Select value={filterSanggar} onValueChange={setFilterSanggar}>
              <SelectTrigger data-testid="select-sanggar"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua sanggar</SelectItem>
                {sanggarList.map(s => <SelectItem key={s.id} value={s.id}>{s.namaSanggar}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {kategori !== "sanggar" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Harga Min</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={hargaMin}
                  onChange={e => setHargaMin(e.target.value)}
                  placeholder="0"
                  data-testid="input-harga-min"
                />
              </div>
              <div>
                <Label className="text-xs">Harga Maks</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={hargaMax}
                  onChange={e => setHargaMax(e.target.value)}
                  placeholder="∞"
                  data-testid="input-harga-max"
                />
              </div>
            </div>
          )}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Menampilkan <span className="font-semibold text-foreground">{filtered.length}</span> hasil.
        </div>
      </Card>

      {/* Render hasil */}
      {kategori === "sanggar" ? (
        <SanggarGrid items={filtered as any} />
      ) : (
        <ItemGrid items={filtered as KatalogItem[]} />
      )}
    </div>
  );
}

function ItemGrid({ items }: { items: KatalogItem[] }) {
  if (items.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground">
        <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <div>Tidak ada item yang cocok dengan filter.</div>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map(item => (
        <Card key={item.id} className="overflow-hidden flex flex-col" data-testid={`card-item-${item.id}`}>
          {item.fotoDataUrl ? (
            <img src={item.fotoDataUrl} className="h-36 w-full object-cover" alt="" />
          ) : (
            <div className="h-36 w-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-primary/40">
              {item.kategori === "sdm" ? <UsersIcon className="h-8 w-8" />
                : item.kategori === "alat_musik" ? <Music2 className="h-8 w-8" />
                : item.kategori === "kostum" ? <Shirt className="h-8 w-8" />
                : <MapPin className="h-8 w-8" />}
            </div>
          )}
          <div className="p-3 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="font-medium text-sm leading-tight">{item.judul}</div>
              <div className="flex flex-wrap gap-1 justify-end">
                {item.jenisKesenian.slice(0, 2).map(k => (
                  <Badge key={k} variant="secondary" className="text-[10px]">{k}</Badge>
                ))}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {item.sanggarNama}
            </div>
            <div className="text-xs mt-2 flex-1 line-clamp-2 text-muted-foreground">{item.deskripsi}</div>
            <div className="mt-3 pt-2 border-t flex items-center justify-between">
              <div className="text-base font-semibold text-primary">
                {fmtRp(item.hargaSewa)}{" "}
                <span className="text-xs text-muted-foreground font-normal">{SATUAN_LABEL[item.satuanHarga]}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function SanggarGrid({ items }: {
  items: Array<{
    id: string; nama: string; alamat: string; jenisKesenian: JenisKesenian[];
    deskripsi: string; foto?: string; noHp?: string; email?: string;
  }>;
}) {
  if (items.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground">
        <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <div>Tidak ada sanggar yang cocok.</div>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map(s => (
        <Card key={s.id} className="overflow-hidden flex flex-col" data-testid={`card-sanggar-${s.id}`}>
          {s.foto ? (
            <img src={s.foto} className="h-36 w-full object-cover" alt="" />
          ) : (
            <div className="h-36 w-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-primary/40">
              <Building2 className="h-10 w-10" />
            </div>
          )}
          <div className="p-3 flex-1 flex flex-col">
            <div className="font-medium leading-tight">{s.nama}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {s.alamat}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {s.jenisKesenian.map(k => (
                <Badge key={k} variant="secondary" className="text-[10px]">{k}</Badge>
              ))}
            </div>
            {s.deskripsi && (
              <div className="text-xs mt-2 flex-1 line-clamp-2 text-muted-foreground">{s.deskripsi}</div>
            )}
            <div className="mt-3 pt-2 border-t text-xs text-muted-foreground space-y-0.5">
              {s.noHp && <div>📞 {s.noHp}</div>}
              {s.email && <div>✉️ {s.email}</div>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
