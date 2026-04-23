import { useAuth, useDb } from "@/lib/auth";
import { fmtDateTime } from "@/lib/store";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileDown } from "lucide-react";
import type { SanggarUser } from "@/lib/types";

export default function Regenerasi() {
  const { user } = useAuth();
  const db = useDb();
  const { toast } = useToast();
  if (!user || user.role !== "sanggar") return null;
  const sg = user as SanggarUser;
  const events = db.activity.filter(a => a.actorId === sg.id || (a.meta && db.users.some(u => u.id === (a.meta as any).id && (u as any).sanggarId === sg.id)))
    .filter(a => ["approve-member", "promote-pelatih", "dismiss-member", "create-member-direct"].includes(a.action))
    .slice(0, 50);

  const exportPdf = () => {
    const pwd = prompt("Password Kurator untuk membuka unduhan:");
    if (pwd !== db.exportPassword) { toast({ title: "Password salah", variant: "destructive" }); return; }
    const html = `<html><head><title>Arsip Regenerasi</title></head><body style="font-family:sans-serif;padding:32px"><h1>Arsip Regenerasi — ${sg.namaSanggar}</h1>${events.map(e => `<p><b>${fmtDateTime(e.ts)}</b> · ${e.action} · ${JSON.stringify(e.meta || {})}</p>`).join("")}</body></html>`;
    const w = window.open("", "_blank"); if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  return (
    <div>
      <PageHeader title="Regenerasi (Arsip)" subtitle="Riwayat mutasi/keluar masuk SDM Sanggar." actions={<Button variant="outline" className="gap-2" onClick={exportPdf}><FileDown className="h-4 w-4" />Ekspor PDF</Button>} />
      <Card className="p-6">
        <ol className="relative border-l border-border ml-2 space-y-4">
          {events.length === 0 && <div className="text-sm text-muted-foreground">Belum ada riwayat.</div>}
          {events.map(e => (
            <li key={e.id} className="ml-4">
              <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" />
              <div className="text-xs text-muted-foreground">{fmtDateTime(e.ts)}</div>
              <div className="text-sm flex items-center gap-2 mt-0.5"><Badge variant="outline" className="text-[10px]">{e.action}</Badge><span className="text-muted-foreground">{JSON.stringify(e.meta || {})}</span></div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
