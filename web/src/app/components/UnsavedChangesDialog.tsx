/**
 * UnsavedChangesDialog — potwierdzenie zamknięcia formularza z niezapisanych zmianami.
 *
 * Opcje: zostać / wyjść bez zapisu / zapisać roboczo (localStorage) i wyjść.
 */

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
  title = "Niezapisane zmiany",
  description = "Masz niezapisane zmiany. Możesz wyjść bez zapisu albo zapisać wersję roboczą lokalnie i wrócić do niej później.",
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display" style={{ fontWeight: 800 }}>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[var(--race-muted)]">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="border-[var(--race-border)] text-[var(--race-fg)] bg-transparent hover:bg-[var(--race-hover)]">
            Zostań
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onDiscard();
            }}
            className="border border-[var(--race-border)] bg-transparent text-[var(--race-fg)] hover:bg-[var(--race-hover)]"
          >
            Wyjdź bez zapisu
          </AlertDialogAction>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onSaveDraft();
            }}
            className="bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95"
          >
            Zapisz roboczo i wyjdź
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
