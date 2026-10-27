/**
 * OrganizerRegistrationsList — obsługa zgłoszeń kierowców do wybranego wydarzenia.
 *
 * Maszyna stanów rejestracji (backend):
 * - Bezpłatne: PENDING → CONFIRMED | CANCELED
 * - Płatne:    PENDING → ACCEPTED (akceptacja) → CONFIRMED (po proof przelewu) | CANCELED
 *
 * Klik w kartę → pełny podgląd (kierowca + auto). Akcje statusu osobno (stopPropagation).
 *
 * Pomysł (alt): bulk accept; powiadomienie e-mail przy zmianie statusu (już częściowo w API).
 */

import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { Check, X, Eye } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import type { Registration, RegistrationStatus } from "../../lib/types";
import type { OrganizerEvent } from "./organizerEventForm";

interface OrganizerRegistrationsListProps {
  registrations: Registration[];
  selectedEvent: OrganizerEvent | undefined;
  /** Lokalne szkice komentarzy per registrationId (przed zapisem statusu). */
  comments: Record<string, string>;
  setComments: Dispatch<SetStateAction<Record<string, string>>>;
  onUpdateStatus: (id: string, status: RegistrationStatus) => void;
  onOpenDetail: (reg: Registration) => void;
}

export function OrganizerRegistrationsList({
  registrations,
  selectedEvent,
  comments,
  setComments,
  onUpdateStatus,
  onOpenDetail,
}: OrganizerRegistrationsListProps) {
  const { t } = useTranslation();

  if (registrations.length === 0) {
    return (
      <p className="text-[var(--race-muted)] text-center py-8">{t("registration.noEntries")}</p>
    );
  }

  return (
    <>
      {registrations.map((reg) => (
        <Card
          key={reg.id}
          className="bg-[var(--race-card)] border-[var(--race-border)] cursor-pointer hover:border-[var(--race-accent)]/50 transition-colors"
          onClick={() => onOpenDetail(reg)}
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[var(--race-fg)]" style={{ fontWeight: 700 }}>
                  {reg.user?.username ?? t("common.driver")}
                </p>
                <p className="text-[var(--race-muted)] text-sm">{reg.user?.email}</p>
                {reg.car && (
                  <p className="text-[var(--race-muted)] text-sm">
                    {t("organizer.carColon", {
                      detail: `${reg.car.make} ${reg.car.model}${
                        reg.car.className ? ` · ${reg.car.className}` : ""
                      }`,
                    })}
                  </p>
                )}
                {reg.note && <p className="text-[var(--race-muted)] text-sm italic">{reg.note}</p>}
                {reg.paymentProofUrl && (
                  <a
                    href={reg.paymentProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--race-accent)] text-sm underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t("organizer.transferProof")}
                  </a>
                )}
                {reg.organizerComment && (
                  <p className="text-sm text-[var(--race-muted)] mt-1">
                    {t("organizer.commentColon", { comment: reg.organizerComment })}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className="bg-[var(--race-muted-bg)] text-[var(--race-fg)]">
                    {t(`registration.${reg.status}`)}
                  </Badge>
                  <span className="text-xs text-[var(--race-accent)] inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {t("common.preview")}
                  </span>
                </div>
              </div>
              <div
                className="flex flex-col gap-2 min-w-[200px]"
                onClick={(e) => e.stopPropagation()}
              >
                <Input
                  placeholder={t("registration.commentOptional")}
                  value={comments[reg.id] || ""}
                  onChange={(e) => setComments((prev) => ({ ...prev, [reg.id]: e.target.value }))}
                  className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
                />
                {reg.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        onUpdateStatus(reg.id, selectedEvent?.paid ? "ACCEPTED" : "CONFIRMED")
                      }
                      className="bg-green-700 hover:bg-green-600 flex-1"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {selectedEvent?.paid ? t("organizer.acceptReg") : t("common.confirm")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateStatus(reg.id, "CANCELED")}
                      className="border-red-800 text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {reg.status === "ACCEPTED" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={!reg.paymentProofUrl}
                      onClick={() => onUpdateStatus(reg.id, "CONFIRMED")}
                      className="bg-green-700 hover:bg-green-600 flex-1 disabled:opacity-40"
                    >
                      {t("registration.confirmPayment")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateStatus(reg.id, "CANCELED")}
                      className="border-red-800 text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
