import { Sparkles, Crown, Star, Sun, Moon, Flame, Award, Compass, Feather, Landmark, Theater, Gem, Music2, Palette, BookOpen, Drum } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export const BRAND_ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement> & { className?: string }>> = {
  Sparkles, Crown, Star, Sun, Moon, Flame, Award, Compass, Feather, Landmark, Theater, Gem, Music2, Palette, BookOpen, Drum,
};

export const BRAND_ICON_KEYS: { key: string; label: string }[] = [
  { key: "Sparkles", label: "Kilau" },
  { key: "Crown", label: "Mahkota" },
  { key: "Star", label: "Bintang" },
  { key: "Sun", label: "Matahari" },
  { key: "Moon", label: "Bulan" },
  { key: "Flame", label: "Api" },
  { key: "Award", label: "Penghargaan" },
  { key: "Compass", label: "Kompas" },
  { key: "Feather", label: "Bulu Pena" },
  { key: "Landmark", label: "Tugu" },
  { key: "Theater", label: "Teater" },
  { key: "Gem", label: "Permata" },
  { key: "Music2", label: "Musik" },
  { key: "Palette", label: "Palet" },
  { key: "BookOpen", label: "Buku" },
  { key: "Drum", label: "Gendang" },
];

export function getBrandIcon(key: string | undefined) {
  return BRAND_ICONS[key ?? "Sparkles"] ?? Sparkles;
}
