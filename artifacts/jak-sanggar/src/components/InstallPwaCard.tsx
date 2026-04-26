import { useEffect, useState } from "react";
import { Download, Smartphone, Share2, Plus, CheckCircle2, X } from "lucide-react";
import {
  getDeferredInstallPrompt,
  isAndroid,
  isIos,
  isStandalone,
} from "@/lib/pwa";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/lib/i18n";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

interface Props {
  variant?: "card" | "button";
  className?: string;
}

export function InstallPwaCard({ variant = "card", className = "" }: Props) {
  const t = useT();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState<BIPEvent | null>(getDeferredInstallPrompt());
  const [installed, setInstalled] = useState<boolean>(isStandalone());
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const onAvail = (e: Event) => {
      const ce = e as CustomEvent<BIPEvent>;
      setPrompt(ce.detail ?? getDeferredInstallPrompt());
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
      toast({
        title: t("Aplikasi terpasang"),
        description: t("Buka dari layar utama HP Abang/Mpok, sat-set!"),
      });
    };
    window.addEventListener("jaksanggar:beforeinstall", onAvail as EventListener);
    window.addEventListener("jaksanggar:appinstalled", onInstalled);
    const onMode = () => setInstalled(isStandalone());
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener?.("change", onMode);
    return () => {
      window.removeEventListener("jaksanggar:beforeinstall", onAvail as EventListener);
      window.removeEventListener("jaksanggar:appinstalled", onInstalled);
      mq.removeEventListener?.("change", onMode);
    };
  }, [toast, t]);

  const triggerInstall = async () => {
    if (prompt) {
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome === "accepted") {
          toast({
            title: t("Mantap!"),
            description: t("Aplikasi lagi dipasang ke HP Abang/Mpok..."),
          });
        }
        setPrompt(null);
        return;
      } catch {
        // fall through
      }
    }
    if (isIos()) {
      setShowIosHelp(true);
      return;
    }
    toast({
      title: t("Belum bisa dipasang otomatis"),
      description: t("Buka di Chrome Android, terus tap menu titik tiga → 'Pasang aplikasi'."),
    });
  };

  if (installed) {
    if (variant === "button") return null;
    return (
      <div
        className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs ${className}`}
        style={{
          background: "linear-gradient(135deg, hsl(142 50% 92%), hsl(142 60% 96%))",
          border: "1px solid hsl(142 50% 60% / 0.35)",
          color: "hsl(142 60% 22%)",
        }}
        data-testid="install-pwa-installed"
      >
        <CheckCircle2 className="h-4 w-4" />
        <span className="font-medium">{t("Aplikasi sudah terpasang di perangkat ini")}</span>
      </div>
    );
  }

  if (variant === "button") {
    return (
      <>
        <button
          type="button"
          onClick={triggerInstall}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all hover:scale-[1.02] ${className}`}
          style={{
            background: "linear-gradient(135deg, hsl(42 80% 60%), hsl(38 65% 42%))",
            color: "hsl(222 60% 10%)",
            boxShadow: "0 4px 14px hsl(42 75% 50% / 0.35)",
          }}
          data-testid="button-install-pwa"
        >
          <Download className="h-3.5 w-3.5" />
          {t("Pasang Aplikasi")}
        </button>
        {showIosHelp && <IosHelpModal onClose={() => setShowIosHelp(false)} />}
      </>
    );
  }

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl p-4 ${className}`}
        style={{
          background:
            "linear-gradient(135deg, hsl(222 60% 10% / 0.04) 0%, hsl(42 75% 50% / 0.08) 100%)",
          border: "1px solid hsl(42 60% 50% / 0.28)",
        }}
        data-testid="install-pwa-card"
      >
        <div className="flex items-start gap-3">
          <div
            className="grid h-11 w-11 flex-none place-items-center rounded-xl"
            style={{
              background: "linear-gradient(135deg, hsl(42 80% 60%) 0%, hsl(38 65% 42%) 100%)",
              boxShadow: "0 6px 20px hsl(42 75% 50% / 0.45)",
            }}
          >
            <Smartphone className="h-5 w-5" style={{ color: "hsl(222 60% 10%)" }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.22em] text-accent">
              {t("Versi Android")}
            </div>
            <div className="font-serif text-base text-foreground">
              {t("Pasang Jak Sanggar di HP")}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {isAndroid()
                ? t("Tap tombol di bawah, izinin pasang. App-nya bakal nongol di layar utama HP, bisa dibuka offline.")
                : isIos()
                  ? t("Buka di Safari → tombol Bagikan → 'Tambahkan ke Layar Utama'.")
                  : t("Buka link ini di Chrome Android atau Safari iPhone biar bisa dipasang sebagai aplikasi.")}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={triggerInstall}
                className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, hsl(42 80% 60%), hsl(38 65% 42%))",
                  color: "hsl(222 60% 10%)",
                  boxShadow: "0 4px 14px hsl(42 75% 50% / 0.35)",
                }}
                data-testid="button-install-pwa-card"
              >
                <Download className="h-3.5 w-3.5" />
                {isIos() ? t("Cara Pasang di iPhone") : t("Pasang Sekarang")}
              </button>
              {!prompt && !isIos() && (
                <span className="text-[10px] text-muted-foreground">
                  {t("(Pakai Chrome Android biar tombolnya aktif)")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      {showIosHelp && <IosHelpModal onClose={() => setShowIosHelp(false)} />}
    </>
  );
}

function IosHelpModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/55 backdrop-blur-sm p-4"
      onClick={onClose}
      data-testid="ios-help-modal"
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ border: "1px solid hsl(42 60% 50% / 0.25)" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          aria-label={t("Tutup")}
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-1 text-[10px] uppercase tracking-[0.22em] text-accent">
          {t("Pasang di iPhone")}
        </div>
        <h3 className="font-serif text-xl">{t("Tiga langkah aja, Bang/Mpok")}</h3>
        <ol className="mt-4 space-y-3 text-sm text-foreground">
          <li className="flex items-start gap-3">
            <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent">1</span>
            <span>{t("Buka halaman ini di browser Safari (bukan Chrome).")}</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent">2</span>
            <span className="flex items-center gap-2">
              {t("Tap ikon")} <Share2 className="h-4 w-4 text-accent" /> {t("Bagikan di bawah layar.")}
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent">3</span>
            <span className="flex items-center gap-2">
              {t("Pilih")} <Plus className="h-4 w-4 text-accent" /> <em>{t("Tambahkan ke Layar Utama")}</em>.
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}
