import { escapeHtml } from "@/lib/utils";

export function safeHtml(strings: TemplateStringsArray, ...values: unknown[]): string {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    const escaped =
      typeof v === "object" && v !== null && "__rawHtml" in (v as Record<string, unknown>)
        ? String((v as { __rawHtml: unknown }).__rawHtml)
        : escapeHtml(v);
    out += escaped + strings[i + 1];
  }
  return out;
}

export function rawHtml(html: string): { __rawHtml: string } {
  return { __rawHtml: html };
}

export function openPrintWindow(opts: {
  title: string;
  bodyHtml: string;
  bodyStyle?: string;
  autoPrint?: boolean;
}): void {
  const safeTitle = escapeHtml(opts.title);
  const style = opts.bodyStyle ?? "font-family:sans-serif;padding:32px";
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${safeTitle}</title></head><body style="${escapeHtml(style)}">${opts.bodyHtml}</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  if (opts.autoPrint !== false) w.print();
}
