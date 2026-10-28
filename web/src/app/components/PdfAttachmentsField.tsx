/**
 * PdfAttachmentsField — lista załączników PDF (regulaminy wydarzenia).
 * Upload → POST /api/uploads/pdf; wartość to tablica URL-i.
 */
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Loader2, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "../lib/api";
import { Button } from "./ui/button";

interface PdfAttachmentsFieldProps {
  value: string[];
  onChange: (urls: string[]) => void;
  className?: string;
}

function fileLabel(url: string, index: number) {
  const name = url.split("/").pop() || "";
  if (name.toLowerCase().endsWith(".pdf")) return name;
  return `PDF ${index + 1}`;
}

export function PdfAttachmentsField({ value, onChange, className }: PdfAttachmentsFieldProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadPdf(file);
      if (!value.includes(res.url)) {
        onChange([...value, res.url]);
      }
      toast.success(t("upload.pdfOk"));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("upload.pdfFail"));
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
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((url, index) => (
            <li
              key={url}
              className="flex items-center gap-2 rounded-md border border-[var(--race-border)] bg-[var(--race-bg)] px-3 py-2"
            >
              <FileText className="w-4 h-4 text-[var(--race-accent)] shrink-0" />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 truncate text-sm text-[var(--race-accent)] underline"
              >
                {fileLabel(url, index)}
              </a>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onChange(value.filter((u) => u !== url))}
                className="border-red-900 text-red-400 hover:bg-red-950 shrink-0"
                aria-label={t("upload.pdfRemove")}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="border-[var(--race-border)] text-[var(--race-fg)] w-full"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Plus className="w-4 h-4 mr-2" />
        )}
        {uploading ? t("upload.uploading") : t("upload.pdfAdd")}
      </Button>
      <p className="text-xs text-[var(--race-muted)]">{t("upload.pdfHint", { mb: 5 })}</p>
    </div>
  );
}
