/**
 * ImageUploadField — wybór pliku JPG/PNG/WebP (max 5 MB) → POST /api/uploads/image.
 * Opcjonalnie zostawia też ręczne pole URL.
 */
import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError, MAX_IMAGE_UPLOAD_BYTES } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  /** Pokazuj pole URL obok uploadu (domyślnie tak). */
  showUrlInput?: boolean;
  urlPlaceholder?: string;
  className?: string;
  inputClassName?: string;
  error?: string;
}

export function ImageUploadField({
  value,
  onChange,
  showUrlInput = true,
  urlPlaceholder = "https://… lub wgraj plik",
  className,
  inputClassName = "bg-[#121212] border-[#2a2a2a] text-white",
  error,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadImage(file);
      onChange(res.url);
      toast.success("Zdjęcie wgrane");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się wgrać zdjęcia");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={className ?? "space-y-2"}>
      <div className="flex flex-col sm:flex-row gap-2">
        {showUrlInput && (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`flex-1 ${inputClassName}`}
            placeholder={urlPlaceholder}
          />
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          className="border-[#2a2a2a] text-white shrink-0"
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ImagePlus className="w-4 h-4 mr-2" />
          )}
          {uploading ? "Wgrywanie…" : "Wgraj zdjęcie"}
        </Button>
      </div>
      {value && (
        <div className="mt-2 w-full max-w-xs aspect-video rounded border border-[#2a2a2a] overflow-hidden bg-[#121212]">
          <img src={value} alt="Podgląd" className="w-full h-full object-cover" />
        </div>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
      <p className="text-xs text-[#9ca3af]">
        JPG / PNG / WebP, max {MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024)} MB. Możesz też wkleić publiczny URL.
      </p>
    </div>
  );
}
