/**
 * SettingsPage – lokalne preferencje UI użytkownika (kokpit).
 *
 * Cel: pozwala kierowcy / organizatorowi / adminowi ustawić powiadomienia (demo),
 * akcent kolorystyczny, tryb pit-stop (minimalne animacje) oraz flair zespołu.
 * Ustawienia żyją wyłącznie w przeglądarce – nie idą na backend.
 *
 * Wzorce: React useState/useEffect, AuthContext (tylko odczyt user.role),
 * localStorage pod kluczem `raceportal_settings`, CSS variables na <html>.
 * Theme: `--race-accent` (kolor marki), `font-display` (Oxanium przez CSS),
 * `data-accent` / `data-pit-stop` na documentElement; pit-stop ustawia `--race-motion`.
 * Auth: strona zakłada zalogowanego usera (gate w routerze); JWT nie jest tu czytany.
 * Docker/nginx: SPA – deep link `/settings` wymaga try_files → index.html.
 *
 * Pomysł (alt): Next.js App Router + cookies/server prefs; Zustand/persisted store;
 * TanStack Query niepotrzebny (brak API); sync ustawień z backendem /api/users/me/settings.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Bell,
  Flame,
  Gauge,
  Loader2,
  Moon,
  Palette,
  Shield,
  Sparkles,
  Trash2,
  Trophy,
  Volume2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  ACCENTS,
  applyUserSettings,
  defaultSettings,
  loadSettings,
  persistSettings,
  ACCENT_GROUPS,
  type AccentTheme,
  type UserSettings,
} from "../lib/userSettings";
import { Reveal } from "../components/Reveal";

export function SettingsPage() {
  const { t } = useTranslation();
  const { user, closeAccount } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [ready, setReady] = useState(false);
  const [teamDraft, setTeamDraft] = useState("");
  const [closeConfirm, setCloseConfirm] = useState("");
  const [closing, setClosing] = useState(false);
  const canCloseAccount = user?.role === "USER" || user?.role === "ORGANIZER";

  // Hydratacja z localStorage po mount (unikamy SSR/hydration mismatch – tu Vite SPA).
  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    setTeamDraft(loaded.teamFlair);
    applyUserSettings(loaded);
    setReady(true);
  }, []);

  /** Zapis do state + localStorage + natychmiastowe zastosowanie CSS vars. */
  const persist = (next: UserSettings, message?: string) => {
    setSettings(next);
    persistSettings(next);
    applyUserSettings(next);
    if (message) toast.success(message);
  };

  const toggle = (key: keyof UserSettings, message: string) => {
    const next = { ...settings, [key]: !settings[key] } as UserSettings;
    persist(next, message);
    // Demo dźwięku UI – Web Audio API (nie backend).
    if (key === "soundFx" && next.soundFx) {
      try {
        const ctx = new AudioContext();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = 880;
        g.gain.value = 0.04;
        o.start();
        o.stop(ctx.currentTime + 0.08);
      } catch {
        /* ignore */
      }
    }
  };

  const setAccent = (accent: AccentTheme) => {
    persist({ ...settings, accent }, t("settings.accentSaved", { label: ACCENTS[accent].label }));
    // Confetti pomijane w trybie pit-stop (mniej ruchu).
    if (settings.pitStopMode) return;
    confetti({
      particleCount: 48,
      spread: 55,
      origin: { y: 0.7 },
      colors: [ACCENTS[accent].color, "#ffffff", "#121212"],
    });
  };

  const saveFlair = () => {
    const teamFlair = teamDraft.trim().slice(0, 32);
    persist({ ...settings, teamFlair }, teamFlair ? `Flair: ${teamFlair}` : "Flair wyczyszczony");
  };

  const handleCloseAccount = async () => {
    const phrase = t("settings.closeAccountPhrase");
    if (closeConfirm.trim().toLowerCase() !== phrase) {
      toast.error(t("settings.closeAccountMismatch"));
      return;
    }
    setClosing(true);
    const result = await closeAccount(closeConfirm.trim());
    setClosing(false);
    if (result.ok) {
      toast.success(result.message || t("settings.closeAccountOk"));
      navigate("/");
    } else {
      toast.error(result.message || t("settings.closeAccountFail"));
    }
  };

  const celebrate = () => {
    if (!settings.pitStopMode) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: [ACCENTS[settings.accent].color, "#fff", "#FF3B3B"],
      });
    }
    toast.message("Checkered flag!", { description: t("settings.savedLocal") });
  };

  if (!ready) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-[var(--race-muted)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--race-accent)]" />
      </div>
    );
  }

  const roleLabel =
    user?.role === "ADMIN"
      ? t("roles.ADMIN_CAPS")
      : user?.role === "ORGANIZER"
        ? t("roles.ORGANIZER_CAPS")
        : t("roles.USER_CAPS");

  return (
    <div className="min-h-screen bg-[var(--race-bg)]">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Reveal className="mb-8">
          <p className="text-[var(--race-accent)] font-display tracking-widest text-sm mb-2">{t("settings.cockpit")}</p>
          <h1 className="font-display text-[var(--race-fg)] mb-2" style={{ fontSize: "36px", fontWeight: 800 }}>
            {t("settings.title")}
          </h1>
          <p className="text-[var(--race-muted)]">
            {t("settings.subtitle", { username: user?.username ?? "" })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className="bg-[var(--race-accent)] text-[var(--race-on-accent)]" style={{ fontWeight: 700 }}>
              <Trophy className="w-3 h-3 mr-1" />
              {roleLabel}
            </Badge>
            {settings.teamFlair ? (
              <Badge variant="outline" className="border-[var(--race-accent)] text-[var(--race-accent)]">
                <Flame className="w-3 h-3 mr-1" />
                {settings.teamFlair}
              </Badge>
            ) : null}
          </div>
        </Reveal>

        <div className="space-y-6">
          <Reveal delay={40}>
          <Card className="bg-[var(--race-card)] border-[var(--race-border)] shadow-[var(--race-card-shadow)]">
            <CardHeader>
              <CardTitle className="text-[var(--race-fg)] flex items-center gap-2 font-display">
                <Bell className="w-5 h-5 text-[var(--race-accent)]" />
                {t("settings.notifications")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <SettingRow
                icon={<Shield className="w-4 h-4 text-[var(--race-accent)]" />}
                title={t("settings.emailAlerts")}
                desc={t("settings.emailAlertsDesc")}
                checked={settings.emailAlerts}
                onChange={() => toggle("emailAlerts", t("settings.savedLocal"))}
              />
              <SettingRow
                icon={<Gauge className="w-4 h-4 text-[var(--race-accent)]" />}
                title={t("settings.startReminders")}
                desc={t("settings.startRemindersDesc")}
                checked={settings.startReminders}
                onChange={() => toggle("startReminders", t("settings.savedLocal"))}
              />
              <SettingRow
                icon={<Volume2 className="w-4 h-4 text-[var(--race-accent)]" />}
                title={t("settings.soundFx")}
                desc={t("settings.soundFxDesc")}
                checked={settings.soundFx}
                onChange={() => toggle("soundFx", t("settings.savedLocal"))}
              />
            </CardContent>
          </Card>
          </Reveal>

          <Reveal delay={120}>
          <Card className="bg-[var(--race-card)] border-[var(--race-border)] shadow-[var(--race-card-shadow)]">
            <CardHeader>
              <CardTitle className="text-[var(--race-fg)] flex items-center gap-2 font-display">
                <Palette className="w-5 h-5 text-[var(--race-accent)]" />
                {t("settings.appearance")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {ACCENT_GROUPS.map((group) => (
                <section key={group.title} className="space-y-3">
                  <h3 className="font-display text-[11px] tracking-[0.18em] text-[var(--race-muted)] uppercase">
                    {group.title === "Tryb ciemny" ? t("settings.darkMode") : t("settings.lightMode")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {group.keys.map((key) => {
                      const item = ACCENTS[key];
                      const active = settings.accent === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setAccent(key)}
                          className={`rounded-lg border p-4 text-left transition-colors ${
                            active
                              ? "bg-[var(--race-hover)]"
                              : "border-[var(--race-border)] bg-[var(--race-bg)] hover:border-[var(--race-muted)]"
                          }`}
                          style={
                            active ? { borderColor: item.color, boxShadow: `0 0 0 1px ${item.color}` } : undefined
                          }
                        >
                          <span
                            className="mb-3 block h-9 rounded-md border border-[var(--race-border)]"
                            style={{
                              background: `linear-gradient(90deg, ${item.surface} 0 62%, ${item.color} 62% 100%)`,
                            }}
                            aria-hidden="true"
                          />
                          <div className="text-[var(--race-fg)] font-semibold mb-1">{item.label}</div>
                          <div className="text-[var(--race-muted)] text-sm">{item.desc}</div>
                          <div
                            className="mt-2 text-[11px] font-display tracking-[0.14em] uppercase min-h-[1rem]"
                            style={{ color: active ? item.color : "transparent" }}
                          >
                            {t("common.active")}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}

              <SettingRow
                icon={<Moon className="w-4 h-4 text-[var(--race-accent)]" />}
                title={t("settings.pitStop")}
                desc={t("settings.pitStopDesc")}
                checked={settings.pitStopMode}
                onChange={() => toggle("pitStopMode", t("settings.savedLocal"))}
              />
            </CardContent>
          </Card>
          </Reveal>

          <Reveal delay={180}>
          <Card className="bg-[var(--race-card)] border-[var(--race-border)] shadow-[var(--race-card-shadow)]">
            <CardHeader>
              <CardTitle className="text-[var(--race-fg)] flex items-center gap-2 font-display">
                <Sparkles className="w-5 h-5 text-[var(--race-accent)]" />
                Flair zespołu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[var(--race-muted)] text-sm">
                Krótka etykieta widoczna przy ustawieniach (np. „Team Gold”, „Night Drift”). Max 32 znaki.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="flair" className="text-[var(--race-fg)]">
                    Nazwa flairu
                  </Label>
                  <Input
                    id="flair"
                    value={teamDraft}
                    onChange={(e) => setTeamDraft(e.target.value)}
                    maxLength={32}
                    placeholder="np. Redline Crew"
                    className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
                  />
                </div>
                <Button
                  onClick={saveFlair}
                  className="bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95 self-end"
                  style={{ fontWeight: 700 }}
                >
                  ZAPISZ FLAIR
                </Button>
              </div>
            </CardContent>
          </Card>
          </Reveal>

          {canCloseAccount ? (
            <Reveal delay={200}>
              <Card className="bg-[var(--race-card)] border-red-500/40 shadow-[var(--race-card-shadow)]">
                <CardHeader>
                  <CardTitle className="text-[var(--race-fg)] flex items-center gap-2 font-display">
                    <Trash2 className="w-5 h-5 text-red-400" />
                    {t("settings.closeAccount")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-[var(--race-muted)] text-sm">{t("settings.closeAccountDesc")}</p>
                  <div className="space-y-2">
                    <Label htmlFor="close-account" className="text-[var(--race-fg)]">
                      {t("settings.closeAccountConfirmLabel")}
                    </Label>
                    <Input
                      id="close-account"
                      value={closeConfirm}
                      onChange={(e) => setCloseConfirm(e.target.value)}
                      placeholder={t("settings.closeAccountPhrase")}
                      autoComplete="off"
                      className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleCloseAccount}
                    disabled={closing || closeConfirm.trim().toLowerCase() !== t("settings.closeAccountPhrase")}
                    className="bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
                    style={{ fontWeight: 700 }}
                  >
                    {closing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        …
                      </>
                    ) : (
                      t("settings.closeAccountButton")
                    )}
                  </Button>
                </CardContent>
              </Card>
            </Reveal>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={celebrate}
              className="bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95"
              style={{ fontWeight: 700 }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              CHECKERED FLAG
            </Button>
            <Link to="/dashboard">
              <Button variant="outline" className="border-[var(--race-border)] text-[var(--race-fg)] hover:bg-[var(--race-hover)]">
                Wróć do konta
              </Button>
            </Link>
            <Link to="/privacy">
              <Button variant="outline" className="border-[var(--race-border)] text-[var(--race-fg)] hover:bg-[var(--race-hover)]">
                Polityka prywatności
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  icon,
  title,
  desc,
  checked,
  onChange,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-1">{icon}</div>
        <div>
          <div className="text-[var(--race-fg)] font-semibold">{title}</div>
          <div className="text-[var(--race-muted)] text-sm">{desc}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
