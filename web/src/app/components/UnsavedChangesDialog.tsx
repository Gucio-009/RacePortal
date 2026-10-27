/**
 * UnsavedChangesDialog — potwierdzenie zamknięcia formularza z niezapisanych zmianami.
 */
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
  onSaveDraft: () => void;
  title?: string;
  description?: string;
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onDiscard,
  onSaveDraft,
  title,
  description,
}: UnsavedChangesDialogProps) {
  const { t } = useTranslation();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display" style={{ fontWeight: 800 }}>
            {title ?? t("unsaved.title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[var(--race-muted)]">
            {description ?? t("unsaved.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="border-[var(--race-border)] text-[var(--race-fg)] bg-transparent hover:bg-[var(--race-hover)]">
            {t("unsaved.stay")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onDiscard();
            }}
            className="border border-[var(--race-border)] bg-transparent text-[var(--race-fg)] hover:bg-[var(--race-hover)]"
          >
            {t("unsaved.discard")}
          </AlertDialogAction>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onSaveDraft();
            }}
            className="bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95"
          >
            {t("unsaved.saveDraft")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
