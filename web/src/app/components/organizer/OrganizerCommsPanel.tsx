/**
 * Masowa komunikacja do kierowców (filtr status/klasa → e-mail + in-app).
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import type { EventClass, RegistrationStatus } from "../../lib/types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const STATUS_OPTS: RegistrationStatus[] = ["PENDING", "ACCEPTED", "CONFIRMED", "CANCELED"];

interface Props {
  eventId: string;
}

export function OrganizerCommsPanel({ eventId }: Props) {
  const { t } = useTranslation();
  const [classes, setClasses] = useState<EventClass[]>([]);
  const [statuses, setStatuses] = useState<RegistrationStatus[]>(["CONFIRMED"]);
  const [classId, setClassId] = useState<string>("all");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendInApp, setSendInApp] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get<EventClass[]>(`/api/events/${eventId}/classes`)
      .then(setClasses)
      .catch(() => setClasses([]));
  }, [eventId]);

  const toggleStatus = (s: RegistrationStatus) => {
    setStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const send = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error(t("organizer.commsRequired"));
      return;
    }
    if (statuses.length === 0) {
      toast.error(t("organizer.commsStatusRequired"));
      return;
    }
    if (!sendEmail && !sendInApp) {
      toast.error(t("organizer.commsChannelRequired"));
      return;
    }
    setBusy(true);
    try {
      const res = await api.post<{ recipients: number; emailed: number; notified: number }>(
        `/api/events/${eventId}/comms/broadcast`,
        {
          statuses,
          classId: classId === "all" ? null : classId,
          subject: subject.trim(),
          body: body.trim(),
          sendEmail,
          sendInApp,
        },
      );
      toast.success(
        t("organizer.commsOk", {
          recipients: res.recipients,
          emailed: res.emailed,
          notified: res.notified,
        }),
      );
    } catch {
      toast.error(t("organizer.commsFail"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <p className="text-[var(--race-fg)]" style={{ fontWeight: 700 }}>
          {t("organizer.commsTitle")}
        </p>
        <p className="text-sm text-[var(--race-muted)]">{t("organizer.commsHint")}</p>
      </div>

      <div className="space-y-2">
        <Label className="text-[var(--race-fg)]">{t("organizer.commsStatuses")}</Label>
        <div className="flex flex-wrap gap-3">
          {STATUS_OPTS.map((s) => (
            <label key={s} className="inline-flex items-center gap-1.5 text-sm text-[var(--race-fg)]">
              <Checkbox checked={statuses.includes(s)} onCheckedChange={() => toggleStatus(s)} />
              {t(`organizer.wsStatus.${s}`)}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[var(--race-fg)]">{t("organizer.commsClass")}</Label>
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("organizer.wsAllClasses")}</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[var(--race-fg)]">{t("organizer.commsSubject")}</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={160}
          className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[var(--race-fg)]">{t("organizer.commsBody")}</Label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          maxLength={5000}
          className="w-full rounded-md border border-[var(--race-border)] bg-[var(--race-bg)] px-3 py-2 text-sm text-[var(--race-fg)]"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-2 text-sm text-[var(--race-fg)]">
          <Checkbox checked={sendEmail} onCheckedChange={(v) => setSendEmail(!!v)} />
          {t("organizer.commsEmail")}
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-[var(--race-fg)]">
          <Checkbox checked={sendInApp} onCheckedChange={(v) => setSendInApp(!!v)} />
          {t("organizer.commsInApp")}
        </label>
      </div>

      <Button
        type="button"
        disabled={busy}
        onClick={() => void send()}
        className="bg-[var(--race-accent)] text-[var(--race-on-accent)]"
        style={{ fontWeight: 700 }}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
        {t("organizer.commsSend")}
      </Button>
    </div>
  );
}
