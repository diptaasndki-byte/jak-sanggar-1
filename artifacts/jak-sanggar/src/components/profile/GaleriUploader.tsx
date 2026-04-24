import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImagePlus, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uid } from "@/lib/store";
import type { FotoGaleriItem } from "@/lib/types";

const MAX_KB = 1200;
const MAX_ITEMS = 12;

export function GaleriUploader({
  items,
  onChange,
  editable,
}: {
  items: FotoGaleriItem[];
  onChange: (next: FotoGaleriItem[]) => void;
  editable: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [view, setView] = useState<FotoGaleriItem | null>(null);

  const handle = (files: FileList) => {
    if (items.length + files.length > MAX_ITEMS) {
      toast({ title: `Maksimum ${MAX_ITEMS} foto`, variant: "destructive" });
      return;
    }
    const next = [...items];
    let pending = files.length;
    Array.from(files).forEach(f => {
      if (f.size > MAX_KB * 1024) {
        toast({ title: `${f.name} terlalu besar`, description: `Maks ${MAX_KB} KB per foto`, variant: "destructive" });
        pending -= 1;
        if (pending === 0) onChange(next);
        return;
      }
      const r = new FileReader();
      r.onload = () => {
        next.push({ id: uid(), dataUrl: String(r.result), createdAt: Date.now() });
        pending -= 1;
        if (pending === 0) onChange([...next]);
      };
      r.readAsDataURL(f);
    });
  };

  const updateCaption = (id: string, caption: string) => {
    onChange(items.map(it => it.id === id ? { ...it, caption } : it));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-medium">Galeri Foto</div>
          <div className="text-xs text-muted-foreground">{items.length}/{MAX_ITEMS} foto · maks {MAX_KB} KB per foto</div>
        </div>
        {editable && (
          <>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && handle(e.target.files)} />
            <Button type="button" variant="outline" className="gap-2" onClick={() => inputRef.current?.click()} disabled={items.length >= MAX_ITEMS}>
              <ImagePlus className="h-4 w-4" />Tambah Foto
            </Button>
          </>
        )}
      </div>
      {items.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground border-dashed">Belum ada foto di galeri.</Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map(it => (
            <Card key={it.id} className="overflow-hidden group">
              <div className="aspect-square bg-muted relative cursor-pointer" onClick={() => setView(it)}>
                <img src={it.dataUrl} alt={it.caption ?? "Foto galeri"} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Eye className="h-6 w-6 text-white" />
                </div>
              </div>
              {editable ? (
                <div className="p-2 space-y-1.5">
                  <Input
                    value={it.caption ?? ""}
                    onChange={e => updateCaption(it.id, e.target.value)}
                    placeholder="Caption (opsional)"
                    className="h-8 text-xs"
                  />
                  <Button type="button" variant="ghost" size="sm" className="w-full h-7 gap-1 text-destructive" onClick={() => onChange(items.filter(x => x.id !== it.id))}>
                    <Trash2 className="h-3 w-3" />Hapus
                  </Button>
                </div>
              ) : it.caption ? (
                <div className="p-2 text-xs text-muted-foreground line-clamp-2">{it.caption}</div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
      <Dialog open={!!view} onOpenChange={o => !o && setView(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{view?.caption ?? "Foto Galeri"}</DialogTitle></DialogHeader>
          {view && <img src={view.dataUrl} alt={view.caption ?? "Foto"} className="w-full rounded-md" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
