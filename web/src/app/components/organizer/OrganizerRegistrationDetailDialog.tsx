/**
 * OrganizerRegistrationDetailDialog — pełny podgląd zgłoszenia (kierowca + auto ze zdjęciem).
 *
 * Otwierany z listy zgłoszeń wydarzenia. Dane z API (UserRef rozszerzony + CarResponse).
 */

import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Badge } from "../ui/badge";
import type { Registration } from "../../lib/types";
import { parseCarClasses } from "../../lib/carMatch";

interface OrganizerRegistrationDetailDialogProps {
  registration: Registration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Row({ label, value }: { label: string; value?: string | number | boolean | null }) {
  const { t } = useTranslation();
  if (value == null || value === "") return null;
  const display =
    typeof value === "boolean" ? (value ? t("common.yes") : t("common.no")) : String(value);
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
  const { t, i18n } = useTranslation();
  const reg = registration;
  const user = reg?.user;
  const car = reg?.car;
  const driverName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    t("common.driver");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display" style={{ fontWeight: 800 }}>
            {t("registration.detailTitle")}
          </DialogTitle>
          <DialogDescription className="text-[var(--race-muted)]">
            {t("registration.detailSubtitle")}
          </DialogDescription>
        </DialogHeader>

        {!reg ? null : (
          <div className="space-y-6 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-[var(--race-muted-bg)] text-[var(--race-fg)]">
                {t(`registration.${reg.status}`)}
              </Badge>
              {reg.paymentDueAt && (
                <span className="text-xs text-[var(--race-muted)]">
                  {t("registration.paymentDue", {
                    date: new Date(reg.paymentDueAt).toLocaleString(i18n.language),
                  })}
                </span>
              )}
            </div>

            <section className="space-y-3">
              <h3 className="text-[var(--race-accent)] text-sm" style={{ fontWeight: 800 }}>
                {t("common.driver")}
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
                  <Row label={t("organizer.fullName")} value={driverName} />
                  <Row label={t("organizer.login")} value={user?.username} />
                  <Row label={t("auth.email")} value={user?.email} />
                  <Row label={t("organizer.phone")} value={user?.phone} />
                  <Row label={t("organizer.address")} value={user?.address} />
                  <Row label={t("organizer.instagram")} value={user?.instagramUrl} />
                  <Row label={t("organizer.licenseB")} value={user?.hasDrivingLicenseB} />
                  <Row
                    label={t("organizer.pzmLicense")}
                    value={user?.pzmLicense?.trim() ? user.pzmLicense : t("common.none")}
                  />
                </div>
              </div>
              {reg.note && (
                <p className="text-sm text-[var(--race-muted)] italic border border-[var(--race-border)] rounded-md p-3">
                  {t("organizer.noteColon", { note: reg.note })}
                </p>
              )}
              {reg.organizerComment && (
                <p className="text-sm text-[var(--race-muted)] border border-[var(--race-border)] rounded-md p-3">
                  {t("organizer.organizerCommentColon", { comment: reg.organizerComment })}
                </p>
              )}
              {reg.paymentProofUrl && (
                <a
                  href={reg.paymentProofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--race-accent)] text-sm underline"
                >
                  {t("organizer.transferProof")}
                </a>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-[var(--race-accent)] text-sm" style={{ fontWeight: 800 }}>
                {t("organizer.vehicle")}
              </h3>
              {!car ? (
                <p className="text-sm text-[var(--race-muted)]">{t("organizer.noCarSelected")}</p>
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
                    <Row label={t("organizer.makeModel")} value={`${car.make} ${car.model}`} />
                    <Row label={t("organizer.year")} value={car.year} />
                    <Row label={t("organizer.drive")} value={car.driveType} />
                    <Row
                      label={t("organizer.power")}
                      value={car.powerHp != null ? t("organizer.powerHpValue", { hp: car.powerHp }) : null}
                    />
                    <Row
                      label={t("organizer.capacity")}
                      value={
                        car.engineCc != null
                          ? t("organizer.capacityValue", { cc: car.engineCc })
                          : null
                      }
                    />
                    <Row
                      label={t("organizer.weight")}
                      value={
                        car.weightKg != null
                          ? t("organizer.weightValue", { kg: car.weightKg })
                          : null
                      }
                    />
                    <Row
                      label={t("organizer.registration")}
                      value={car.registered ? car.plate || t("common.yes") : t("common.no")}
                    />
                    <Row label={t("organizer.registrationType")} value={car.registrationType} />
                    <Row label={t("organizer.kssNumber")} value={car.kssNumber} />
                    <Row label={t("organizer.cage")} value={car.hasRollCage} />
                    <Row label={t("organizer.ocShort")} value={car.hasOc} />
                    <Row label={t("organizer.ptShort")} value={car.hasPt} />
                    <Row label={t("organizer.social")} value={car.socialUrl} />
                    <Row label={t("organizer.video")} value={car.videoUrl} />
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
                      {t("organizer.modificationsColon", { text: car.modifications })}
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
