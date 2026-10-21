/**
 * Lista zgłoszeń błędów w panelu admina.
 */
import { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { api, ApiError } from "../lib/api";
import { toast } from "sonner";

interface BugReport {
  id: string;
  message: string;
  pageUrl: string | null;
  createdAt: string;
  username: string | null;
  accountEmail: string | null;
  contactEmail: string | null;
}

function who(report: BugReport) {
  if (report.username) {
    return `${report.username} (${report.accountEmail ?? ""})`;
  }
  if (report.contactEmail) {
    return report.contactEmail;
  }
  return "Gość";
}

export function AdminBugReports() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<BugReport[]>("/api/bug-reports")
      .then((data) => {
        if (!cancelled) setReports(data);
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Nie udało się pobrać zgłoszeń.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-[#9ca3af] text-center py-8">Ładowanie zgłoszeń…</p>;
  }
  if (reports.length === 0) {
    return <p className="text-[#9ca3af] text-center py-8">Brak zgłoszonych błędów.</p>;
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardContent className="p-6 space-y-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 text-sm text-[#9ca3af]">
              <span>{who(report)}</span>
              <time dateTime={report.createdAt}>
                {new Date(report.createdAt).toLocaleString("pl-PL")}
              </time>
            </div>
            {report.pageUrl && (
              <p className="text-xs text-[var(--race-accent)] break-all">{report.pageUrl}</p>
            )}
            <p className="text-white whitespace-pre-wrap">{report.message}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
