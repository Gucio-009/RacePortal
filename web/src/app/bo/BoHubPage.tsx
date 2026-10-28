import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Calendar, ClipboardList, Bug, Users, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { AdminStats, AdminUser, OrganizerApplication, ApiEvent } from "../lib/types";
import { Button } from "../components/ui/button";
import { downloadBoCsv } from "./csv";

interface PendingEvent extends ApiEvent {
  organizer?: { id: string; username: string; email: string } | null;
}

interface BugReport {
  id: string;
  message: string;
  pageUrl: string | null;
  createdAt: string;
  username: string | null;
  accountEmail: string | null;
  contactEmail: string | null;
  status: "OPEN" | "DONE";
}

export function BoHubPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [openBugs, setOpenBugs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dumping, setDumping] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<AdminStats>("/api/admin/stats"),
      api.get<BugReport[]>("/api/bug-reports").catch(() => [] as BugReport[]),
    ])
      .then(([s, bugs]) => {
        if (cancelled) return;
        setStats(s);
        setOpenBugs(bugs.filter((b) => b.status !== "DONE").length);
      })
      .catch((e) => {
        if (!cancelled) toast.error(e instanceof ApiError ? e.message : "Nie udało się załadować hubu");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const exportAll = async () => {
    setDumping(true);
    try {
      const [users, pending, approved, apps, bugs] = await Promise.all([
        api.get<AdminUser[]>("/api/admin/users"),
        api.get<PendingEvent[]>("/api/admin/events/pending"),
        api.get<PendingEvent[]>("/api/admin/events/approved"),
        api.get<OrganizerApplication[]>("/api/admin/organizer-applications"),
        api.get<BugReport[]>("/api/bug-reports").catch(() => [] as BugReport[]),
      ]);
      const events = [...pending, ...approved];
      downloadBoCsv(
        "uzytkownicy",
        ["id", "username", "email", "role", "createdAt"],
        users.map((u) => [u.id, u.username, u.email, u.role, u.createdAt]),
      );
      downloadBoCsv(
        "wydarzenia",
        ["id", "name", "status", "category", "date", "track", "city", "voivodeship", "paid", "entryFee", "organizerUsername", "organizerEmail", "rejectionReason"],
        events.map((e) => [
          e.id,
          e.name,
          e.status,
          e.category,
          e.date,
          e.track,
          e.city,
          e.voivodeship,
          e.paid,
          e.entryFee,
          e.organizer?.username,
          e.organizer?.email,
          e.rejectionReason,
        ]),
      );
      downloadBoCsv(
        "wnioski",
        ["id", "status", "company", "businessType", "userUsername", "userEmail", "message", "createdAt"],
        apps.map((a) => [
          a.id,
          a.status,
          a.company,
          a.businessType,
          a.user?.username,
          a.user?.email,
          a.message,
          a.createdAt,
        ]),
      );
      downloadBoCsv(
        "bledy",
        ["id", "status", "createdAt", "username", "accountEmail", "contactEmail", "pageUrl", "message"],
        bugs.map((b) => [
          b.id,
          b.status,
          b.createdAt,
          b.username,
          b.accountEmail,
          b.contactEmail,
          b.pageUrl,
          b.message,
        ]),
      );
      toast.success("Wyeksportowano 4 pliki CSV");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Eksport nieudany");
    } finally {
      setDumping(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[var(--race-muted)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--race-accent)] mr-2" />
        Ładowanie…
      </div>
    );
  }

  const queue = [
    {
      label: "Wydarzenia oczekujące",
      count: stats?.pendingEvents ?? 0,
      to: "/wydarzenia?tab=pending",
      icon: Calendar,
    },
    {
      label: "Wnioski organizatora",
      count: stats?.pendingApps ?? 0,
      to: "/wnioski?status=PENDING",
      icon: ClipboardList,
    },
    {
      label: "Otwarte błędy",
      count: openBugs,
      to: "/bledy?status=OPEN",
      icon: Bug,
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl" style={{ fontWeight: 800 }}>
            Hub
          </h1>
          <p className="text-[var(--race-muted)] mt-1">
            Witaj, <span className="text-[var(--race-fg)]">{user?.username}</span> ({user?.email})
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={dumping}
          onClick={() => void exportAll()}
          className="border-[var(--race-accent)] text-[var(--race-accent)]"
          style={{ fontWeight: 700 }}
        >
          {dumping ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Eksport wszystkiego (CSV)
        </Button>
      </div>

      <section>
        <h2 className="text-sm uppercase tracking-[0.16em] text-[var(--race-muted)] mb-3" style={{ fontWeight: 700 }}>
          Kolejka wymagająca akcji
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {queue.map(({ label, count, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="rounded-lg border border-[var(--race-border)] bg-[var(--race-card)] p-5 hover:border-[var(--race-accent)] transition-colors"
            >
              <Icon className="w-5 h-5 text-[var(--race-accent)] mb-3" />
              <p className="font-display text-3xl text-[var(--race-accent)]" style={{ fontWeight: 800 }}>
                {count}
              </p>
              <p className="text-sm text-[var(--race-muted)] mt-1">{label}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-[0.16em] text-[var(--race-muted)] mb-3" style={{ fontWeight: 700 }}>
          Moduły
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: "/wydarzenia", label: "Wydarzenia", icon: Calendar },
            { to: "/uzytkownicy", label: "Użytkownicy", icon: Users },
            { to: "/wnioski", label: "Wnioski", icon: ClipboardList },
            { to: "/bledy", label: "Błędy", icon: Bug },
          ].map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-2 rounded-md border border-[var(--race-border)] bg-[var(--race-card)] px-4 py-3 text-sm hover:bg-[var(--race-hover)]"
              style={{ fontWeight: 600 }}
            >
              <Icon className="w-4 h-4 text-[var(--race-accent)]" />
              {label}
            </Link>
          ))}
        </div>
      </section>

      {stats && (
        <p className="text-xs text-[var(--race-muted)]">
          Razem: {stats.users} użytkowników · {stats.events} wydarzeń · {stats.registrations} zgłoszeń
        </p>
      )}
    </div>
  );
}
