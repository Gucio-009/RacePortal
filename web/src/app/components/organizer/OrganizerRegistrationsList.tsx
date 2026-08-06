/**
 * OrganizerRegistrationsList — obsługa zgłoszeń kierowców do wybranego wydarzenia.
 *
 * Maszyna stanów rejestracji (backend):
 * - Bezpłatne: PENDING → CONFIRMED | CANCELED
 * - Płatne:    PENDING → ACCEPTED (akceptacja) → CONFIRMED (po proof przelewu) | CANCELED
 *
 * Przycisk „Akceptuj” vs „Potwierdź” zależy od `selectedEvent.paid`.
 * „Potwierdź wpłatę” wymaga `paymentProofUrl` (disabled bez dowodu).
 * Komentarz organizatora: lokalny state `comments[regId]` → wysyłany w `onUpdateStatus`.
 *
 * Pomysł (alt): bulk accept; powiadomienie e-mail przy zmianie statusu (już częściowo w API).
 */

import type { Dispatch, SetStateAction } from "react";
import { Check, X } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import type { Registration, RegistrationStatus } from "../../lib/types";
import { registrationStatusLabel } from "../../lib/types";
import type { OrganizerEvent } from "./organizerEventForm";

interface OrganizerRegistrationsListProps {
  registrations: Registration[];
  selectedEvent: OrganizerEvent | undefined;
  /** Lokalne szkice komentarzy per registrationId (przed zapisem statusu). */
  comments: Record<string, string>;
  setComments: Dispatch<SetStateAction<Record<string, string>>>;
  onUpdateStatus: (id: string, status: RegistrationStatus) => void;
}

export function OrganizerRegistrationsList({
  registrations,
  selectedEvent,
  comments,
  setComments,
  onUpdateStatus,
}: OrganizerRegistrationsListProps) {
  if (registrations.length === 0) {
    return <p className="text-[#9ca3af] text-center py-8">Brak zgłoszeń dla tego wydarzenia.</p>;
  }

  return (
    <>
      {registrations.map((reg) => (
        <Card key={reg.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <p className="text-white" style={{ fontWeight: 700 }}>
                  {reg.user?.username ?? "Kierowca"}
                </p>
                <p className="text-[#9ca3af] text-sm">{reg.user?.email}</p>
                {reg.car && (
                  <p className="text-[#9ca3af] text-sm">
                    Auto: {reg.car.make} {reg.car.model}
                    {reg.car.className ? ` · ${reg.car.className}` : ""}
                  </p>
                )}
                {reg.note && <p className="text-[#9ca3af] text-sm italic">{reg.note}</p>}
                {reg.paymentProofUrl && (
                  <a
                    href={reg.paymentProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--race-accent)] text-sm underline"
                  >
                    Potwierdzenie przelewu
                  </a>
                )}
                {reg.organizerComment && (
                  <p className="text-sm text-[#9ca3af] mt-1">Komentarz: {reg.organizerComment}</p>
                )}
                <Badge className="mt-2 bg-[#2a2a2a] text-white">{registrationStatusLabel(reg.status)}</Badge>
              </div>
              <div className="flex flex-col gap-2 min-w-[200px]">
                <Input
                  placeholder="Komentarz (opcjonalnie)"
                  value={comments[reg.id] || ""}
                  onChange={(e) => setComments((prev) => ({ ...prev, [reg.id]: e.target.value }))}
                  className="bg-[#121212] border-[#2a2a2a] text-white"
                />
                {/* PENDING: płatne → ACCEPTED; bezpłatne → od razu CONFIRMED */}
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
                      {selectedEvent?.paid ? "Akceptuj" : "Potwierdź"}
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
                {/* ACCEPTED (tylko płatne): czekamy na proof → CONFIRMED */}
                {reg.status === "ACCEPTED" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={!reg.paymentProofUrl}
                      onClick={() => onUpdateStatus(reg.id, "CONFIRMED")}
                      className="bg-green-700 hover:bg-green-600 flex-1 disabled:opacity-40"
                    >
                      Potwierdź wpłatę
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
