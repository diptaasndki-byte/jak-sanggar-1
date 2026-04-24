import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Trash2, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MAX_PROFILE_KB = 800;

export function ProfilePhotoUploader({
  value,
  onChange,
  fallbackText,
}: {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  fallbackText?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handle = (file: File) => {
    if (file.size > MAX_PROFILE_KB * 1024) {
      toast({ title: "Ukuran terlalu besar", description: `Maksimum ${MAX_PROFILE_KB} KB`, variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  const initial = (fallbackText ?? "?").trim().slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        <div className="h-28 w-28 rounded-full bg-muted overflow-hidden border-2 border-primary/30 grid place-items-center">
          {value ? (
            <img src={value} alt="Foto profil" className="h-full w-full object-cover" />
          ) : (
            <div className="font-serif text-3xl text-muted-foreground flex items-center gap-1">
              {initial || <UserIcon className="h-10 w-10" />}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handle(e.target.files[0])} />
        <Button type="button" variant="outline" className="gap-2" onClick={() => inputRef.current?.click()}>
          <Camera className="h-4 w-4" />Unggah Foto
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" className="gap-1 text-destructive" onClick={() => onChange(undefined)}>
            <Trash2 className="h-3.5 w-3.5" />Hapus
          </Button>
        )}
        <div className="text-[11px] text-muted-foreground">JPG/PNG, maks {MAX_PROFILE_KB} KB.</div>
      </div>
    </div>
  );
}
