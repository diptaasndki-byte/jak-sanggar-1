// PWA helpers: register service worker + ekspos beforeinstallprompt event.

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface WindowEventMap {
    "jaksanggar:beforeinstall": CustomEvent<BIPEvent>;
    "jaksanggar:appinstalled": Event;
  }
}

let cachedPrompt: BIPEvent | null = null;

export function getDeferredInstallPrompt(): BIPEvent | null {
  return cachedPrompt;
}

export function setupPwa() {
  if (typeof window === "undefined") return;

  // Tangkap beforeinstallprompt sedini mungkin (sebelum React render kelar).
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    cachedPrompt = e as BIPEvent;
    window.dispatchEvent(
      new CustomEvent("jaksanggar:beforeinstall", { detail: cachedPrompt }),
    );
  });

  window.addEventListener("appinstalled", () => {
    cachedPrompt = null;
    window.dispatchEvent(new Event("jaksanggar:appinstalled"));
  });

  // Daftarkan service worker setelah load (hanya non-dev untuk menghindari HMR konflik).
  if ("serviceWorker" in navigator) {
    const isLocalhost =
      location.hostname === "localhost" || location.hostname === "127.0.0.1";
    // Dev pakai HMR — SW bisa cache yang stale. Skip di dev kalau dirasa
    // mengganggu, tapi banyak Replit preview butuh SW agar installable.
    // Kompromi: tetap register, tapi pakai updateViaCache: 'none'.
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    const scope = import.meta.env.BASE_URL;
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register(swUrl, { scope, updateViaCache: "none" })
        .catch((err) => {
          // Jangan crash app kalau SW gagal (misal sandbox iframe).
          console.warn("[Jak Sanggar] SW register gagal:", err);
        });
      void isLocalhost;
    });
  }
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // iOS Safari
  // @ts-expect-error - non-standard tapi umum
  if (window.navigator.standalone) return true;
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
