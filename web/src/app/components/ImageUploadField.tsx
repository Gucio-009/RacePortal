/**
 * ImageUploadField — wgrywanie pliku JPG/PNG/WebP (max 5 MB) → POST /api/uploads/image.
 * URL jest opcjonalnym fallbackiem (ukryty za „Wklej URL”).
 */
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImagePlus, Loader2, Link2, X } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError, MAX_IMAGE_UPLOAD_BYTES } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  /** Pokazuj opcję wklejenia URL (domyślnie tak, zwinięta). */
  allowUrl?: boolean;
  urlPlaceholder?: string;
  className?: string;
  inputClassName?: string;
  error?: string;
}

export function ImageUploadField({
  value,
  onChange,
  allowUrl = true,
  urlPlaceholder = "https://…",
  className,
  inputClassName = "bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]",
  error,
}: ImageUploadFieldProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [previewBroken, setPreviewBroken] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadImage(file);
      onChange(res.url);
      setShowUrl(false);
      setPreviewBroken(false);
      toast.success(t("upload.ok"));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("upload.fail"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={className ?? "space-y-2"}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#3a3a3a] bg-[var(--race-bg)] hover:border-[var(--race-accent)]/60 hover:bg-[#161616] px-4 py-6 text-center transition disabled:opacity-60"
      >
        {uploading ? (
          <Loader2 className="w-8 h-8 animate-spin text-[var(--race-accent)]" />
        ) : (
          <ImagePlus className="w-8 h-8 text-[var(--race-accent)]" />
        )}
        <span className="text-[var(--race-fg)] text-sm font-semibold">
          {uploading ? t("upload.uploading") : t("upload.chooseFile")}
        </span>
        <span className="text-xs text-[var(--race-muted)]">
          {t("upload.hint", { mb: MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024) })}
        </span>
      </button>

      {value && (
        <div className="relative w-full max-w-xs aspect-video rounded border border-[var(--race-border)] overflow-hidden bg-[var(--race-bg)]">
          <img
            src={value}
            alt={t("common.preview")}
            className="w-full h-full object-cover"
            onLoad={() => setPreviewBroken(false)}
            onError={() => setPreviewBroken(true)}
          />
          <button
            type="button"
            aria-label={t("upload.clear")}
            title={t("upload.clear")}
            onClick={() => {
              setPreviewBroken(false);
              onChange("");
            }}
            className="absolute top-1.5 right-1.5 p-1 rounded bg-black/70 text-[var(--race-fg)] hover:bg-black"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {previewBroken && (
        <p className="text-xs text-red-400">Nie udało się wyświetlić zdjęcia. Sprawdź plik albo adres.</p>
      )}

      {allowUrl && (
        <div>
          <button
            type="button"
            className="text-xs text-[var(--race-muted)] hover:text-[var(--race-accent)] inline-flex items-center gap-1"
            onClick={() => setShowUrl((v) => !v)}
          >
            <Link2 className="w-3 h-3" />
            {showUrl ? t("upload.hideUrl") : t("upload.pasteUrl")}
          </button>
          {showUrl && (
            <Input
              value={value}
              onChange={(e) => {
                setPreviewBroken(false);
                onChange(e.target.value);
              }}
              className={`mt-2 ${inputClassName}`}
              placeholder={urlPlaceholder}
            />
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
