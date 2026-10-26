/**
 * OrganizerEventDraftsDialog — lista lokalnych wersji roboczych nowych wydarzeń.
 */

import { FileText, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  eventDraftLabel,
  type EventDraftEntry,
} from "../../lib/formDraft";
import { OTHER } from "../../lib/eventFormPresets";
import type { FormState } from "./organizerEventForm";

interface OrganizerEventDraftsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drafts: EventDraftEntry<FormState>[];
  onOpenDraft: (draft: EventDraftEntry<FormState>) => void;
  onDeleteDraft: (id: string) => void;
}

function formatSavedAt(ts: number): string {
  try {
    return new Intl.DateTimeFormat("pl-PL", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleString();
  }
}

function draftSubtitle(data: FormState): string {
  const parts = [data.date, data.trackKey === OTHER ? data.trackOther : data.trackKey, data.city]
    .map((p) => p?.trim())
    .filter(Boolean);
  return parts.join(" · ");
}

export function OrganizerEventDraftsDialog({
  open,
  onOpenChange,
  drafts,
  onOpenDraft,
  onDeleteDraft,
}: OrganizerEventDraftsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display" style={{ fontWeight: 800 }}>
            Wersje robocze
          </DialogTitle>
          <DialogDescription className="text-[var(--race-muted)]">
            Lokalne szkice nowych wydarzeń na tym urządzeniu. Nie są widoczne dla innych.
          </DialogDescription>
        </DialogHeader>

        {drafts.length === 0 ? (
          <p className="text-sm text-[var(--race-muted)] py-6 text-center">
            Brak wersji roboczych. Zapisz formularz nowego wydarzenia opcją „Zapisz roboczo”.
          </p>
        ) : (
          <ul className="space-y-2 py-2">
            {drafts.map((draft) => (
              <li
                key={draft.id}
                className="flex items-start gap-3 rounded-md border border-[var(--race-border)] bg-[var(--race-bg)] p-3"
              >
                <FileText className="w-4 h-4 mt-1 shrink-0 text-[var(--race-muted)]" />
                <button
                  type="button"
                  className="flex-1 min-w-0 text-left hover:opacity-90"
                  onClick={() => onOpenDraft(draft)}
                >
                  <div className="font-medium text-[var(--race-fg)] truncate">
                    {eventDraftLabel(draft.data)}
                  </div>
                  {draftSubtitle(draft.data) ? (
                    <div className="text-xs text-[var(--race-muted)] truncate mt-0.5">
                      {draftSubtitle(draft.data)}
                    </div>
                  ) : null}
                  <div className="text-xs text-[var(--race-muted)] mt-1">
                    Zapisano {formatSavedAt(draft.savedAt)}
                  </div>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-[var(--race-muted)] hover:text-red-400"
                  aria-label="Usuń wersję roboczą"
                  onClick={() => onDeleteDraft(draft.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
