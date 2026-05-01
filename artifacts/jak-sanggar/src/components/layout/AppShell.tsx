import { type ReactNode, useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, useDb } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, LogOut, Sun, Moon, Sparkles, ChevronDown, UserCog, Menu, X } from "lucide-react";
import type { Role, ThemeMode } from "@/lib/types";
import { load, save } from "@/lib/store";
import { PucukRebungDivider } from "@/components/betawi/Ornaments";
import { getBrandIcon } from "@/lib/brandIcons";
import { useT } from "@/lib/i18n";
import { InstallPwaCard } from "@/components/InstallPwaCard";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetHeader } from "@/components/ui/sheet";

interface NavItem { label: string; href: string; icon: ReactNode; children?: NavItem[]; }

function SidebarNavList({
  nav, loc, role, testIdPrefix,
}: { nav: NavItem[]; loc: string; role: Role; testIdPrefix: string }) {
  const isActive = (href: string) =>
    loc === href || (href !== `/${role}` && loc.startsWith(href));
  return (
    <>
      {nav.map((n) => {
        const active = isActive(n.href);
        const hasChildren = !!n.children?.length;
        const childActive = hasChildren && n.children!.some((c) => isActive(c.href));
        const expanded = hasChildren && (active || childActive);
        return (
          <div key={n.href} className="mb-1">
            <Link
              href={n.href}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                active
                  ? "text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
              }`}
              data-testid={`${testIdPrefix}-${n.href.replace(/\//g, "-")}`}
              aria-expanded={hasChildren ? expanded : undefined}
            >
              {active && (
                <>
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r"
                    style={{
                      background: "linear-gradient(180deg, hsl(42 80% 65%), hsl(38 70% 45%))",
                      boxShadow: "0 0 10px hsl(42 75% 55% / 0.7)",
                    }}
                  />
                  <span
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: "linear-gradient(90deg, hsl(var(--sidebar-accent)) 0%, hsl(var(--sidebar) / 0.8) 100%)",
                      boxShadow: "inset 0 1px 0 hsl(42 60% 50% / 0.15)",
                    }}
                  />
                </>
              )}
              <span className={`relative transition-all ${active ? "text-sidebar-primary" : "opacity-80 group-hover:opacity-100 group-hover:text-sidebar-primary"}`}>{n.icon}</span>
              <span className="relative flex-1">{n.label}</span>
              {hasChildren && (
                <ChevronDown
                  className={`relative h-3.5 w-3.5 transition-transform duration-200 ${
                    expanded ? "rotate-0 text-sidebar-primary" : "-rotate-90 text-sidebar-foreground/45"
                  }`}
                  aria-hidden="true"
                />
              )}
            </Link>
            {hasChildren && expanded && (
              <ul className="relative mt-1 ml-5 pl-3 border-l border-sidebar-border/60 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                {n.children!.map((c) => {
                  const cActive = isActive(c.href);
                  return (
                    <li key={c.href}>
                      <Link
                        href={c.href}
                        className={`group relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors ${
                          cActive
                            ? "text-sidebar-primary-foreground font-medium bg-sidebar-accent/70"
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                        }`}
                        data-testid={`${testIdPrefix}-${c.href.replace(/\//g, "-")}`}
                      >
                        <span
                          className={`h-1 w-1 rounded-full ${cActive ? "bg-sidebar-primary" : "bg-sidebar-foreground/35 group-hover:bg-sidebar-primary"}`}
                          aria-hidden="true"
                        />
                        <span className={cActive ? "text-sidebar-primary" : "opacity-75 group-hover:opacity-100"}>{c.icon}</span>
                        <span className="truncate">{c.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </>
  );
}

const ROLE_KEY: Record<Role, string> = {
  kurator: "Kurator",
  admin: "Admin",
  sanggar: "Sanggar",
  pelatih: "Pelatih",
  seniman: "Seniman",
  juri: "Juri",
};

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme !== "light");
  root.classList.toggle("luxury", theme === "luxury");
}

function applyLang(lang: string) {
  if (typeof document !== "undefined") document.documentElement.dataset.lang = lang;
}

function applyStudio(studio: any) {
  const root = document.documentElement;
  const setVar = (name: string, value: string | undefined) => {
    if (value !== undefined && value !== "") root.style.setProperty(name, value);
    else root.style.removeProperty(name);
  };
  if (!studio) return;
  setVar("--app-font-serif", studio.fontSerif ? `'${studio.fontSerif}', Georgia, serif` : undefined);
  setVar("--app-font-sans", studio.fontSans ? `'${studio.fontSans}', system-ui, sans-serif` : undefined);
  setVar("--radius", studio.borderRadius != null ? `${studio.borderRadius}rem` : undefined);
  setVar("--foreground", studio.foregroundHsl);
  setVar("--background", studio.backgroundHsl);
  setVar("--card", studio.cardHsl);
  setVar("--border", studio.borderHsl);
  setVar("--sidebar", studio.sidebarHsl);
  setVar("--sidebar-foreground", studio.sidebarFgHsl);
  if (studio.fontScale != null) {
    root.style.setProperty("font-size", `${Math.round(studio.fontScale * 16)}px`);
  } else {
    root.style.removeProperty("font-size");
  }
}

export function AppShell({ nav, children }: { nav: NavItem[]; children: ReactNode }) {
  const { user, logout } = useAuth();
  const db = useDb();
  const [loc, navigate] = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const t = useT();
  const labels = ROLE_KEY;

  // Tutup drawer mobile saat pindah halaman
  useEffect(() => { setMobileNavOpen(false); }, [loc]);

  useEffect(() => {
    const ap = load().appearance;
    if (ap.primaryHsl) document.documentElement.style.setProperty("--primary", ap.primaryHsl);
    if (ap.accentHsl) document.documentElement.style.setProperty("--accent", ap.accentHsl);
    const theme: ThemeMode = ap.theme ?? (ap.dark ? "dark" : "light");
    applyTheme(theme);
    applyLang(ap.language ?? "id");
    applyStudio(ap.studio);
  }, [db.appearance.theme, db.appearance.primaryHsl, db.appearance.accentHsl, db.appearance.dark, db.appearance.language, db.appearance.studio]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  if (!user) return null;
  const initials = ((user as any).nama || (user as any).namaSanggar || user.username)
    .split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase();
  const displayName = (user as any).namaSanggar || (user as any).nama || user.username;

  const brand = db.appearance.brand;
  const appName = brand?.appName || "Jak Sanggar";
  const tagline = brand?.appTagline || "Kebudayaan akan bernyawa karena ketulusan";
  const footer1 = brand?.sidebarFooterLine1 || "Kebudayaan akan bernyawa";
  const footer2 = brand?.sidebarFooterLine2 || "karena ketulusan";
  const BrandIcon = getBrandIcon(brand?.iconKey);
  const backdrop = db.appearance.backdrop;
  const customTheme = db.appearance.customTheme;
  const studio = db.appearance.studio;

  const currentTheme: ThemeMode = db.appearance.theme ?? (db.appearance.dark ? "dark" : "light");
  const cycleTheme = () => {
    const order: ThemeMode[] = ["light", "dark", "luxury"];
    const next = order[(order.indexOf(currentTheme) + 1) % order.length];
    save(d => {
      d.appearance.theme = next;
      d.appearance.themePreset = next;
      d.appearance.dark = next !== "light";
      if (d.appearance.customTheme?.enabled) {
        d.appearance.customTheme.enabled = false;
        d.appearance.customTheme.previousBaseline = undefined;
      }
    });
  };

  const profilePath =
    user.role === "sanggar" ? "/sanggar/profil" :
    user.role === "seniman" ? "/seniman/profil" :
    user.role === "juri" ? "/juri/profil" : null;

  return (
    <div className="min-h-screen flex bg-background">
      <aside
        className="hidden md:flex w-64 flex-col text-sidebar-foreground border-r border-sidebar-border relative overflow-hidden"
        style={{
          background: "linear-gradient(180deg, hsl(var(--sidebar)) 0%, hsl(var(--sidebar) / 0.94) 100%)",
        }}
      >
        {studio?.sidebarImageDataUrl && (
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${studio.sidebarImageDataUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: Math.max(0, Math.min(1, studio.sidebarImageOpacity ?? 0.18)),
            }}
          />
        )}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><g fill='none' stroke='%23d4a64e' stroke-width='0.6'><path d='M20 60 L40 20 L60 60 Z'/><circle cx='40' cy='40' r='2'/></g></svg>\")",
            backgroundSize: "120px 120px",
          }}
        />
        <div className="relative px-5 py-5 flex items-center gap-3 border-b border-sidebar-border">
          {brand?.logoDataUrl ? (
            <div
              className="h-10 w-10 rounded-lg overflow-hidden grid place-items-center bg-white/5"
              style={{ boxShadow: "0 0 18px hsl(42 75% 50% / 0.3), 0 0 0 1px hsl(42 60% 50% / 0.25)" }}
            >
              <img src={brand.logoDataUrl} alt={appName} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div
              className="h-10 w-10 rounded-lg grid place-items-center"
              style={{
                background: "linear-gradient(135deg, hsl(42 80% 60%) 0%, hsl(38 65% 42%) 100%)",
                boxShadow: "0 0 20px hsl(42 75% 50% / 0.4), 0 1px 0 hsl(42 90% 80%) inset",
              }}
            >
              <BrandIcon className="h-5 w-5" style={{ color: "hsl(222 60% 10%)" }} />
            </div>
          )}
          <div className="min-w-0">
            <div className="font-serif text-lg leading-tight truncate">{appName}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/55">{t(labels[user.role])}</div>
          </div>
        </div>

        <nav className="relative flex-1 overflow-y-auto scrollbar-thin py-3 px-2.5">
          <SidebarNavList nav={nav} loc={loc} role={user.role} testIdPrefix="nav" />
        </nav>

        <div className="relative border-t border-sidebar-border p-3 space-y-2">
          <div className="px-1">
            <InstallPwaCard variant="button" className="w-full justify-center" />
          </div>
          <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/45 px-2">{footer1}</div>
          <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/45 px-2">{footer2}</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 glass border-b border-border/60">
          <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-3">
            <div className="md:hidden flex items-center gap-2 min-w-0">
              <button
                type="button"
                data-tradisi="silent"
                onClick={() => setMobileNavOpen(true)}
                aria-label={t("Buka menu navigasi")}
                aria-expanded={mobileNavOpen}
                className="h-9 w-9 grid place-items-center rounded-md hover:bg-muted text-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 shrink-0"
                data-testid="button-mobile-nav-open"
              >
                <Menu className="h-5 w-5" />
              </button>
              {brand?.logoDataUrl ? (
                <img src={brand.logoDataUrl} alt={appName} className="h-8 w-8 rounded-md object-cover shrink-0" />
              ) : (
                <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center shrink-0">
                  <BrandIcon className="h-4 w-4" />
                </div>
              )}
              <div className="font-serif text-base truncate">{appName}</div>
            </div>

            {/* Central compact nav (desktop only) — shows top 5 nav items with gold underline on active */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {nav.slice(0, 5).map(n => {
                const selfActive = loc === n.href || (n.href !== `/${user.role}` && loc.startsWith(n.href));
                const childActive = !!n.children?.some(c => loc === c.href || loc.startsWith(c.href));
                const active = selfActive || childActive;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`relative px-3 py-1.5 text-[13px] rounded-md transition-colors ${
                      active ? "text-foreground" : "text-foreground/65 hover:text-foreground hover:bg-muted/60"
                    }`}
                    data-testid={`topnav-${n.href.replace(/\//g, "-")}`}
                  >
                    {n.label}
                    {active && (
                      <span
                        className="absolute left-2.5 right-2.5 -bottom-[2px] h-[3px] rounded-full"
                        style={{
                          background: "linear-gradient(90deg, hsl(38 60% 42%), hsl(42 80% 60%), hsl(38 60% 42%))",
                          boxShadow: "0 0 10px hsl(42 75% 55% / 0.6)",
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden md:block lg:hidden text-sm text-muted-foreground">
              <span className="font-serif italic">"{tagline}"</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                data-tradisi="silent"
                className="relative h-9 w-9 grid place-items-center rounded-md hover:bg-muted transition-colors text-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                aria-label={t("Notifikasi")}
                title={t("Notifikasi")}
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
              </button>

              <button
                type="button"
                data-tradisi="silent"
                onClick={cycleTheme}
                className="h-9 w-9 grid place-items-center rounded-md hover:bg-muted transition-colors text-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                aria-label={`${t("Tema diperbarui")} (${currentTheme})`}
                title={`Tema: ${currentTheme}`}
              >
                {currentTheme === "light" ? <Sun className="h-4 w-4" /> :
                 currentTheme === "dark" ? <Moon className="h-4 w-4" /> :
                 <Sparkles className="h-4 w-4 text-accent" />}
              </button>

              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  data-tradisi="silent"
                  onClick={() => setProfileOpen(o => !o)}
                  aria-label={t("Profil Saya")}
                  aria-expanded={profileOpen}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  <Avatar className="h-7 w-7 border border-accent/40">
                    {(user as any).fotoProfileDataUrl ? (
                      <img src={(user as any).fotoProfileDataUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">{initials}</AvatarFallback>
                    )}
                  </Avatar>
                  <span className="hidden sm:inline text-sm max-w-[140px] truncate">{displayName}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-xl glass shadow-lg overflow-hidden p-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2.5 border-b border-border/60">
                      <div className="text-sm font-medium truncate">{displayName}</div>
                      <div className="text-xs text-muted-foreground truncate">@{user.username} · {t(labels[user.role])}</div>
                    </div>
                    {profilePath && (
                      <button
                        type="button"
                        data-tradisi="silent"
                        onClick={() => { setProfileOpen(false); navigate(profilePath); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted text-left"
                      >
                        <UserCog className="h-4 w-4" /> {t("Profil Saya")}
                      </button>
                    )}
                    <button
                      type="button"
                      data-tradisi="silent"
                      onClick={() => { setProfileOpen(false); logout(); navigate("/"); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-destructive/10 text-destructive text-left"
                      data-testid="button-logout"
                    >
                      <LogOut className="h-4 w-4" /> {t("Keluar")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <PucukRebungDivider className="opacity-50" />
        </header>

        <main className="relative flex-1 overflow-y-auto betawi-watermark">
          <ImpersonationBanner />
          {customTheme?.enabled && customTheme.bgImageDataUrl && (
            <div
              aria-hidden="true"
              className="pointer-events-none fixed inset-0 z-0"
              style={{
                backgroundImage: `url(${customTheme.bgImageDataUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: Math.max(0, Math.min(1, customTheme.bgOpacity ?? 0.22)),
              }}
            />
          )}
          {backdrop?.enabled && backdrop.imageDataUrl && (
            <div
              aria-hidden="true"
              className="pointer-events-none fixed inset-0 z-0"
              style={{
                backgroundImage: `url(${backdrop.imageDataUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: Math.max(0, Math.min(1, backdrop.opacity ?? 0.18)),
                mixBlendMode: backdrop.blendMode ?? "soft-light",
              }}
            />
          )}
          <div key={loc} className="relative page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>
        </main>
      </div>

      {/* Mobile navigation drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-[82vw] max-w-[320px] p-0 border-r border-sidebar-border text-sidebar-foreground overflow-hidden"
          style={{
            background: "linear-gradient(180deg, hsl(var(--sidebar)) 0%, hsl(var(--sidebar) / 0.96) 100%)",
          }}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{appName}</SheetTitle>
            <SheetDescription>{t("Navigasi utama")}</SheetDescription>
          </SheetHeader>
          <div className="relative flex h-full flex-col">
            {studio?.sidebarImageDataUrl && (
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url(${studio.sidebarImageDataUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  opacity: Math.max(0, Math.min(1, studio.sidebarImageOpacity ?? 0.18)),
                }}
              />
            )}
            <div
              className="absolute inset-0 opacity-[0.07] pointer-events-none"
              style={{
                backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><g fill='none' stroke='%23d4a64e' stroke-width='0.6'><path d='M20 60 L40 20 L60 60 Z'/><circle cx='40' cy='40' r='2'/></g></svg>\")",
                backgroundSize: "120px 120px",
              }}
            />

            <div className="relative px-5 py-5 flex items-center gap-3 border-b border-sidebar-border">
              {brand?.logoDataUrl ? (
                <div className="h-10 w-10 rounded-lg overflow-hidden grid place-items-center bg-white/5"
                  style={{ boxShadow: "0 0 18px hsl(42 75% 50% / 0.3), 0 0 0 1px hsl(42 60% 50% / 0.25)" }}>
                  <img src={brand.logoDataUrl} alt={appName} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-lg grid place-items-center"
                  style={{
                    background: "linear-gradient(135deg, hsl(42 80% 60%) 0%, hsl(38 65% 42%) 100%)",
                    boxShadow: "0 0 20px hsl(42 75% 50% / 0.4), 0 1px 0 hsl(42 90% 80%) inset",
                  }}>
                  <BrandIcon className="h-5 w-5" style={{ color: "hsl(222 60% 10%)" }} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-serif text-lg leading-tight truncate">{appName}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/55">{t(labels[user.role])}</div>
              </div>
              <button
                type="button"
                data-tradisi="silent"
                onClick={() => setMobileNavOpen(false)}
                className="h-8 w-8 grid place-items-center rounded-md hover:bg-sidebar-accent/60 text-sidebar-foreground/70 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                aria-label={t("Tutup menu navigasi")}
                data-testid="button-mobile-nav-close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="relative flex-1 overflow-y-auto scrollbar-thin py-3 px-2.5">
              <SidebarNavList nav={nav} loc={loc} role={user.role} testIdPrefix="mobile-nav" />
            </nav>

            <div className="relative border-t border-sidebar-border p-3 space-y-2">
              <div className="px-1">
                <InstallPwaCard variant="button" className="w-full justify-center" />
              </div>
              <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/45 px-2">{footer1}</div>
              <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/45 px-2">{footer2}</div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
