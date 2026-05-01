import { LogOut, UserCog } from "lucide-react";
import { useAuth, useDb } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export function ImpersonationBanner() {
  const { user, impersonatedFromId, stopImpersonation } = useAuth();
  const db = useDb();
  const { toast } = useToast();
  if (!impersonatedFromId || !user) return null;
  const original = db.users.find((u) => u.id === impersonatedFromId);
  const displayName =
    (user as { namaSanggar?: string; nama?: string }).namaSanggar ??
    (user as { nama?: string }).nama ??
    user.username;
  const handleStop = () => {
    if (stopImpersonation()) {
      toast({
        title: "Kembali ke akun Kurator",
        description: `Sesi sebagai ${displayName} (${user.role}) dihentikan.`,
      });
    }
  };
  return (
    <div
      className="sticky top-0 z-40 w-full"
      style={{
        background:
          "linear-gradient(90deg, hsl(42 80% 60%) 0%, hsl(38 65% 42%) 100%)",
        boxShadow: "0 2px 12px hsl(42 75% 50% / 0.4)",
      }}
      data-testid="impersonation-banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 flex-wrap">
        <div
          className="flex items-center gap-2 text-xs sm:text-sm font-medium"
          style={{ color: "hsl(222 60% 10%)" }}
        >
          <UserCog className="h-4 w-4 flex-none" />
          <span>
            Mode <strong>Login As</strong>: Abang/Mpok Kurator
            {original ? ` (${original.username})` : ""} sedang melihat dasbor
            sebagai <strong>{displayName}</strong>{" "}
            <span className="opacity-75">[{user.role}]</span>.
          </span>
        </div>
        <button
          type="button"
          onClick={handleStop}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all hover:scale-[1.02]"
          style={{
            background: "hsl(222 60% 10%)",
            color: "hsl(42 80% 70%)",
          }}
          data-testid="button-stop-impersonation"
        >
          <LogOut className="h-3.5 w-3.5" />
          Kembali ke Kurator
        </button>
      </div>
    </div>
  );
}
