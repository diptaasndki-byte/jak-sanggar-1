import { type ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { LogOut, Sparkles } from "lucide-react";
import type { Role } from "@/lib/types";
import { load } from "@/lib/store";

interface NavItem { label: string; href: string; icon: ReactNode; }

const labels: Record<Role, string> = {
  kurator: "Kurator",
  admin: "Admin",
  sanggar: "Sanggar",
  pelatih: "Pelatih",
  seniman: "Seniman",
  juri: "Juri",
};

export function AppShell({ nav, children }: { nav: NavItem[]; children: ReactNode }) {
  const { user, logout } = useAuth();
  const [loc, navigate] = useLocation();

  useEffect(() => {
    const ap = load().appearance;
    document.documentElement.style.setProperty("--primary", ap.primaryHsl);
    document.documentElement.style.setProperty("--accent", ap.accentHsl);
    document.documentElement.classList.toggle("dark", ap.dark);
  }, []);

  if (!user) return null;
  const initials = ((user as any).nama || (user as any).namaSanggar || user.username)
    .split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase();
  const displayName = (user as any).namaSanggar || (user as any).nama || user.username;

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-5 py-6 flex items-center gap-2.5 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-md bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-serif text-lg leading-tight">Jak Sanggar</div>
            <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">{labels[user.role]}</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
          {nav.map((n) => {
            const active = loc === n.href || (n.href !== `/${user.role}` && loc.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-0.5 transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
                data-testid={`nav-${n.href.replace(/\//g, "-")}`}
              >
                <span className="opacity-90">{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <Separator className="bg-sidebar-border" />
        <div className="p-3 flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{displayName}</div>
            <div className="text-xs text-sidebar-foreground/60 truncate">@{user.username}</div>
          </div>
          <Button variant="ghost" size="icon" className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => { logout(); navigate("/"); }} data-testid="button-logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-14 px-4 flex items-center justify-between border-b bg-card">
          <div className="font-serif text-lg">Jak Sanggar · {labels[user.role]}</div>
          <Button variant="ghost" size="icon" onClick={() => { logout(); navigate("/"); }}><LogOut className="h-4 w-4" /></Button>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
