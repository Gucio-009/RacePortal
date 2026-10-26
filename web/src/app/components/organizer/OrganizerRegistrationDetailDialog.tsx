/**
 * OrganizerRegistrationDetailDialog — pełny podgląd zgłoszenia (kierowca + auto ze zdjęciem).
 *
 * Otwierany z listy zgłoszeń wydarzenia. Dane z API (UserRef rozszerzony + CarResponse).
 */

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Badge } from "../ui/badge";
import type { Registration } from "../../lib/types";
import { registrationStatusLabel } from "../../lib/types";
import { parseCarClasses } from "../../lib/carMatch";

interface OrganizerRegistrationDetailDialogProps {
  registration: Registration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Row({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value == null || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "Tak" : "Nie") : String(value);
  return (
    <div className="flex justify-between gap-3 text-sm py-1 border-b border-[var(--race-border)]/60 last:border-0">
      <span className="text-[var(--race-muted)] shrink-0">{label}</span>
      <span className="text-[var(--race-fg)] text-right break-all">{display}</span>
    </div>
  );
}

export function OrganizerRegistrationDetailDialog({
  registration,
  open,
  onOpenChange,
}: OrganizerRegistrationDetailDialogProps) {
  const reg = registration;
  const user = reg?.user;
  const car = reg?.car;
  const driverName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || "Kierowca";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display" style={{ fontWeight: 800 }}>
            Podgląd zgłoszenia
          </DialogTitle>
          <DialogDescription className="text-[var(--race-muted)]">
            Pełne dane kierowcy i pojazdu.
          </DialogDescription>
        </DialogHeader>

        {!reg ? null : (
          <div className="space-y-6 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-[var(--race-muted-bg)] text-[var(--race-fg)]">
                {registrationStatusLabel(reg.status)}
              </Badge>
              {reg.paymentDueAt && (
                <span className="text-xs text-[var(--race-muted)]">
                  Termin wpłaty: {new Date(reg.paymentDueAt).toLocaleString("pl-PL")}
                </span>
              )}
            </div>

            <section className="space-y-3">
              <h3 className="text-[var(--race-accent)] text-sm" style={{ fontWeight: 800 }}>
                Kierowca
              </h3>
              <div className="flex gap-4 items-start">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={driverName}
                    className="w-16 h-16 rounded-full object-cover border border-[var(--race-border)] shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[var(--race-muted-bg)] flex items-center justify-center text-[var(--race-accent)] font-display shrink-0" style={{ fontWeight: 800 }}>
                    {(user?.username ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <Row label="Imię i nazwisko" value={driverName} />
                  <Row label="Login" value={user?.username} />
                  <Row label="E-mail" value={user?.email} />
                  <Row label="Telefon" value={user?.phone} />
                  <Row label="Adres" value={user?.address} />
                  <Row label="Instagram" value={user?.instagramUrl} />
                  <Row label="Prawo jazdy kat. B" value={user?.hasDrivingLicenseB} />
                  <Row label="Licencja PZM" value={user?.pzmLicense?.trim() ? user.pzmLicense : "Brak"} />
                </div>
              </div>
              {reg.note && (
                <p className="text-sm text-[var(--race-muted)] italic border border-[var(--race-border)] rounded-md p-3">
                  Notatka: {reg.note}
                </p>
              )}
              {reg.organizerComment && (
                <p className="text-sm text-[var(--race-muted)] border border-[var(--race-border)] rounded-md p-3">
                  Komentarz organizatora: {reg.organizerComment}
                </p>
              )}
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
            </section>

            <section className="space-y-3">
              <h3 className="text-[var(--race-accent)] text-sm" style={{ fontWeight: 800 }}>
                Pojazd
              </h3>
              {!car ? (
                <p className="text-sm text-[var(--race-muted)]">Brak wybranego auta.</p>
              ) : (
                <div className="space-y-3">
                  {car.imageUrl && (
                    <img
                      src={car.imageUrl}
                      alt={`${car.make} ${car.model}`}
                      className="w-full max-h-56 object-cover rounded-md border border-[var(--race-border)]"
                    />
                  )}
                  <div className="space-y-0.5">
                    <Row label="Marka / model" value={`${car.make} ${car.model}`} />
                    <Row label="Rocznik" value={car.year} />
                    <Row label="Napęd" value={car.driveType} />
                    <Row label="Moc" value={car.powerHp != null ? `${car.powerHp} KM` : null} />
                    <Row
                      label="Pojemność"
                      value={car.engineCc != null ? `${car.engineCc} cm³` : null}
                    />
                    <Row label="Masa" value={car.weightKg != null ? `${car.weightKg} kg` : null} />
                    <Row label="Rejestracja" value={car.registered ? car.plate || "Tak" : "Nie"} />
                    <Row label="Typ rejestracji" value={car.registrationType} />
                    <Row label="Numer KSS" value={car.kssNumber} />
                    <Row label="Klatka" value={car.hasRollCage} />
                    <Row label="OC" value={car.hasOc} />
                    <Row label="PT" value={car.hasPt} />
                    <Row label="Social" value={car.socialUrl} />
                    <Row label="Wideo" value={car.videoUrl} />
                  </div>
                  {parseCarClasses(car.className).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {parseCarClasses(car.className).map((tag) => (
                        <Badge
                          key={tag}
                          className="bg-[var(--race-accent)]/15 text-[var(--race-accent)] border border-[var(--race-accent)]/40"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {car.modifications && (
                    <p className="text-sm text-[var(--race-muted)] border border-[var(--race-border)] rounded-md p-3 whitespace-pre-wrap">
                      Modyfikacje: {car.modifications}
                    </p>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
