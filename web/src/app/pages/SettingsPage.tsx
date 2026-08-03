import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import {
  Bell,
  Flame,
  Gauge,
  Loader2,
  Moon,
  Palette,
  Shield,
  Sparkles,
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

type AccentTheme = "gold" | "redline" | "ice";

type UserSettings = {
  emailAlerts: boolean;
  startReminders: boolean;
  soundFx: boolean;
  pitStopMode: boolean;
  accent: AccentTheme;
  teamFlair: string;
};

const STORAGE_KEY = "raceportal_settings";

const ACCENTS: Record<AccentTheme, { label: string; color: string; desc: string }> = {
  gold: { label: "Złoty tor", color: "#FFD700", desc: "Klasyczny look RACEPORTAL" },
  redline: { label: "Redline", color: "#FF3B3B", desc: "Agresywny akcent wyścigowy" },
  ice: { label: "Ice cold", color: "#7DD3FC", desc: "Chłodny, nocny pit-lane" },
};

function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultSettings(), ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return defaultSettings();
}

function defaultSettings(): UserSettings {
  return {
    emailAlerts: true,
    startReminders: true,
    soundFx: false,
    pitStopMode: false,
    accent: "gold",
    teamFlair: "",
  };
}

export function applyUserSettings(settings: UserSettings) {
  const accent = ACCENTS[settings.accent]?.color ?? "#FFD700";
  const root = document.documentElement;
  root.style.setProperty("--race-accent", accent);
  root.dataset.accent = settings.accent;
  root.dataset.pitStop = settings.pitStopMode ? "on" : "off";
  if (settings.pitStopMode) {
    root.style.setProperty("--race-motion", "0.01ms");
  } else {
    root.style.removeProperty("--race-motion");
  }
}

export function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [ready, setReady] = useState(false);
  const [teamDraft, setTeamDraft] = useState("");

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    setTeamDraft(loaded.teamFlair);
    applyUserSettings(loaded);
    setReady(true);
  }, []);

  const persist = (next: UserSettings, message?: string) => {
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    applyUserSettings(next);
    if (message) toast.success(message);
  };

  const toggle = (key: keyof UserSettings, message: string) => {
    const next = { ...settings, [key]: !settings[key] } as UserSettings;
    persist(next, message);
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
    persist({ ...settings, accent }, `Akcent: ${ACCENTS[accent].label}`);
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

  const celebrate = () => {
    if (!settings.pitStopMode) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: [ACCENTS[settings.accent].color, "#fff", "#FF3B3B"],
      });
    }
    toast.message("Checkered flag!", { description: "Ustawienia zapisane lokalnie w tej przeglądarce." });
  };

  if (!ready) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-[#9ca3af]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--race-accent)]" />
      </div>
    );
  }

  const roleLabel =
    user?.role === "ADMIN" ? "ADMINISTRATOR" : user?.role === "ORGANIZER" ? "ORGANIZATOR" : "KIEROWCA";

  return (
    <div className="min-h-screen bg-[#121212]">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8">
          <p className="text-[var(--race-accent)] font-['Orbitron'] tracking-widest text-sm mb-2">KOKPIT</p>
          <h1 className="font-['Orbitron'] text-white mb-2" style={{ fontSize: "36px", fontWeight: 900 }}>
            USTAWIENIA
          </h1>
          <p className="text-[#9ca3af]">
            Preferencje lokalne konta <span className="text-white">{user?.username}</span> — zapisują się w tej
            przeglądarce.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className="bg-[var(--race-accent)] text-[#121212]" style={{ fontWeight: 700 }}>
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
        </div>

        <div className="space-y-6">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 font-['Orbitron']">
                <Bell className="w-5 h-5 text-[var(--race-accent)]" />
                Powiadomienia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <SettingRow
                icon={<Shield className="w-4 h-4 text-[var(--race-accent)]" />}
                title="Alerty e-mail"
                desc="Potwierdzenia zgłoszeń i statusów (Mailpit w dev)"
                checked={settings.emailAlerts}
                onChange={() =>
                  toggle("emailAlerts", settings.emailAlerts ? "Alerty e-mail wyłączone" : "Alerty e-mail włączone")
                }
              />
              <SettingRow
                icon={<Gauge className="w-4 h-4 text-[var(--race-accent)]" />}
                title="Przypomnienia o starcie"
                desc="Przypominaj o nadchodzących wydarzeniach"
                checked={settings.startReminders}
                onChange={() =>
                  toggle(
                    "startReminders",
                    settings.startReminders ? "Przypomnienia wyłączone" : "Przypomnienia włączone",
                  )
                }
              />
              <SettingRow
                icon={<Volume2 className="w-4 h-4 text-[var(--race-accent)]" />}
                title="Dźwięki UI"
                desc="Krótki bip przy przełączaniu (demo)"
                checked={settings.soundFx}
                onChange={() => toggle("soundFx", settings.soundFx ? "Dźwięki wyłączone" : "Dźwięki włączone")}
              />
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 font-['Orbitron']">
                <Palette className="w-5 h-5 text-[var(--race-accent)]" />
                Wygląd
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.keys(ACCENTS) as AccentTheme[]).map((key) => {
                  const item = ACCENTS[key];
                  const active = settings.accent === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAccent(key)}
                      className={`rounded-lg border p-4 text-left transition-all ${
                        active ? "bg-[#161616]" : "border-[#2a2a2a] bg-[#121212] hover:border-[#444]"
                      }`}
                      style={active ? { borderColor: item.color, boxShadow: `0 0 0 1px ${item.color}` } : undefined}
                    >
                      <div className="w-8 h-8 rounded-full mb-3 border border-white/20" style={{ background: item.color }} />
                      <div className="text-white font-semibold mb-1">{item.label}</div>
                      <div className="text-[#9ca3af] text-sm">{item.desc}</div>
                    </button>
                  );
                })}
              </div>

              <SettingRow
                icon={<Moon className="w-4 h-4 text-[var(--race-accent)]" />}
                title="Tryb pit-stop"
                desc="Minimalne animacje — jak w boksach przed wyjazdem"
                checked={settings.pitStopMode}
                onChange={() =>
                  toggle("pitStopMode", settings.pitStopMode ? "Pełne animacje" : "Tryb pit-stop włączony")
                }
              />
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 font-['Orbitron']">
                <Sparkles className="w-5 h-5 text-[var(--race-accent)]" />
                Flair zespołu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[#9ca3af] text-sm">
                Krótka etykieta widoczna przy ustawieniach (np. „Team Gold”, „Night Drift”). Max 32 znaki.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="flair" className="text-white">
                    Nazwa flairu
                  </Label>
                  <Input
                    id="flair"
                    value={teamDraft}
                    onChange={(e) => setTeamDraft(e.target.value)}
                    maxLength={32}
                    placeholder="np. Redline Crew"
                    className="bg-[#121212] border-[#2a2a2a] text-white"
                  />
                </div>
                <Button
                  onClick={saveFlair}
                  className="bg-[var(--race-accent)] text-[#121212] hover:brightness-95 self-end"
                  style={{ fontWeight: 700 }}
                >
                  ZAPISZ FLAIR
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={celebrate}
              className="bg-[var(--race-accent)] text-[#121212] hover:brightness-95"
              style={{ fontWeight: 700 }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              CHECKERED FLAG
            </Button>
            <Link to="/dashboard">
              <Button variant="outline" className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]">
                Wróć do konta
              </Button>
            </Link>
            <Link to="/privacy">
              <Button variant="outline" className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]">
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
          <div className="text-white font-semibold">{title}</div>
          <div className="text-[#9ca3af] text-sm">{desc}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
