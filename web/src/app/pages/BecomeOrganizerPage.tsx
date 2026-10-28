/**
 * BecomeOrganizerPage – wniosek USER → ORGANIZER (rozpatrywany w AdminPanel).
 *
 * Cel: zalogowany kierowca wysyła firmę + opis doświadczenia; admin zatwierdza.
 * Wzorce: formularz POST `/api/organizer/apply` z JWT; status GET `/api/organizer/my-application`.
 * Auth: wymaga `isAuthenticated` (toast + navigate); API też egzekwuje JWT.
 * Theme: `--race-accent`, `font-display`. Docker/nginx: deep link → SPA try_files.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { Building2, MessageSquare, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { api, ApiError } from "../lib/api";
import type { OrganizerApplication } from "../lib/types";
import { toast } from "sonner";

const BUSINESS_TYPE_KEYS = [
  "private",
  "company",
  "sole",
  "assoc",
  "foundation",
  "club",
] as const;

export function BecomeOrganizerPage() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(isAuthenticated);
  const [existing, setExisting] = useState<OrganizerApplication | null>(null);
  const [sent, setSent] = useState(false);

  const alreadyOrganizer = user?.role === "ORGANIZER" || user?.role === "ADMIN";
  const showPending = sent || existing?.status === "PENDING";
  const showForm =
    !alreadyOrganizer &&
    !showPending &&
    existing?.status !== "APPROVED";

  useEffect(() => {
    if (!isAuthenticated || alreadyOrganizer) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    api
      .get<OrganizerApplication | undefined>("/api/organizer/my-application")
      .then((app) => {
        if (!cancelled && app) setExisting(app);
      })
      .catch(() => {
        /* brak wniosku lub błąd – pokaż formularz */
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, alreadyOrganizer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info(t("becomeOrganizer.loginRequired"));
      navigate("/login");
      return;
    }
    if (!businessType) {
      toast.error(t("becomeOrganizer.needType"));
      return;
    }
    setLoading(true);
    try {
      const created = await api.post<OrganizerApplication>("/api/organizer/apply", {
        company: company.trim(),
        businessType,
        message: message.trim(),
      });
      setExisting(created);
      setSent(true);
      toast.success(t("becomeOrganizer.okToast"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("becomeOrganizer.fail"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <section className="bg-[var(--race-card)] border-b border-[var(--race-border)] py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="font-display text-[var(--race-fg)] mb-3" style={{ fontSize: "40px", fontWeight: 800 }}>
            {t("becomeOrganizer.titleBefore")} <span className="text-[var(--race-accent)]">{t("becomeOrganizer.titleAccent")}</span>
          </h1>
          <p className="text-[var(--race-muted)]">
            {t("becomeOrganizer.heroDesc")}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 max-w-2xl space-y-6">
        {checking ? (
          <div className="flex items-center justify-center gap-3 text-[var(--race-muted)] py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--race-accent)]" />
            {t("becomeOrganizer.checking")}
          </div>
        ) : alreadyOrganizer ? (
          <div className="bg-[var(--race-card)] border border-[var(--race-border)] rounded-lg p-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-[var(--race-fg)]" style={{ fontWeight: 700 }}>
              {t("becomeOrganizer.alreadyTitle")}
            </p>
            <p className="text-[var(--race-muted)]">{t("becomeOrganizer.alreadyDesc")}</p>
            <Link to="/organizer">
              <Button className="bg-[var(--race-accent)] text-[var(--race-on-accent)]" style={{ fontWeight: 700 }}>
                {t("nav.organizerPanelFull")}
              </Button>
            </Link>
          </div>
        ) : showPending ? (
          <div className="bg-[var(--race-card)] border border-[var(--race-border)] rounded-lg p-8 text-center space-y-4">
            <Clock className="w-12 h-12 text-[var(--race-accent)] mx-auto" />
            <p className="text-[var(--race-fg)]" style={{ fontWeight: 700 }}>
              {t("becomeOrganizer.pendingTitle")}
            </p>
            <p className="text-[var(--race-muted)]">
              {existing?.company ? (
                <>
                  {t("becomeOrganizer.pendingCompany", { company: existing.company })}
                  {existing.businessType ? ` · ${existing.businessType}` : ""}.{" "}
                </>
              ) : null}
              {t("becomeOrganizer.pendingDesc")}
            </p>
            <Link to="/dashboard">
              <Button className="bg-[var(--race-accent)] text-[var(--race-on-accent)]" style={{ fontWeight: 700 }}>
                {t("becomeOrganizer.back")}
              </Button>
            </Link>
          </div>
        ) : existing?.status === "APPROVED" ? (
          <div className="bg-[var(--race-card)] border border-[var(--race-border)] rounded-lg p-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-[var(--race-fg)]" style={{ fontWeight: 700 }}>
              {t("becomeOrganizer.approvedTitle")}
            </p>
            <p className="text-[var(--race-muted)]">
              {t("becomeOrganizer.approvedDesc")}
            </p>
            <Link to="/organizer">
              <Button className="bg-[var(--race-accent)] text-[var(--race-on-accent)]" style={{ fontWeight: 700 }}>
                {t("nav.organizerPanelFull")}
              </Button>
            </Link>
          </div>
        ) : null}

        {existing?.status === "REJECTED" && showForm && (
          <div className="bg-[var(--race-card)] border border-[var(--race-border)] rounded-lg p-6 text-center space-y-2">
            <XCircle className="w-10 h-10 text-red-400 mx-auto" />
            <p className="text-[var(--race-fg)]" style={{ fontWeight: 700 }}>
              {t("becomeOrganizer.rejectedBannerTitle")}
            </p>
            <p className="text-[var(--race-muted)] text-sm">{t("becomeOrganizer.rejectedBannerDesc")}</p>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-[var(--race-card)] border border-[var(--race-border)] rounded-lg p-8 space-y-6">
            {!isAuthenticated && (
              <p className="text-[var(--race-accent)] text-sm">
                {t("becomeOrganizer.mustLogin")}{" "}
                <Link to="/login" className="underline">
                  {t("becomeOrganizer.signInLink")}
                </Link>
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="org-apply-company" className="text-[var(--race-fg)] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[var(--race-accent)]" />
                {t("becomeOrganizer.company")} *
              </Label>
              <Input
                id="org-apply-company"
                name="company"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)] h-12"
                placeholder="np. Tor Racing Sp. z o.o."
                autoComplete="organization"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-apply-businessType" className="text-[var(--race-fg)]">
                {t("becomeOrganizer.businessType")} <span className="text-red-500 font-bold">*</span>
              </Label>
              <select
                id="org-apply-businessType"
                name="businessType"
                required
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full h-12 rounded-md bg-[var(--race-bg)] border border-[var(--race-border)] text-[var(--race-fg)] px-3"
              >
                <option value="">{t("becomeOrganizer.chooseType")}</option>
                {BUSINESS_TYPE_KEYS.map((typeKey) => (
                  <option key={typeKey} value={t(`becomeOrganizer.types.${typeKey}`)}>
                    {t(`becomeOrganizer.types.${typeKey}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-apply-message" className="text-[var(--race-fg)] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--race-accent)]" />
                {t("becomeOrganizer.message")} *
              </Label>
              <Textarea
                id="org-apply-message"
                name="message"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
                placeholder={t("becomeOrganizer.messagePlaceholder")}
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !isAuthenticated}
              className="w-full bg-[var(--race-accent)] text-[var(--race-on-accent)] h-12"
              style={{ fontWeight: 800 }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("becomeOrganizer.submitting")}
                </>
              ) : (
                t("becomeOrganizer.submit")
              )}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
