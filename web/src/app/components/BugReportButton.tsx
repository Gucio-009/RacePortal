/**
 * Przycisk „Zgłoś błąd” na każdej stronie, także bez logowania.
 * Ścieżka bierze się z adresu w przeglądarce. Konto dopina API z JWT.
 */
import { useState } from "react";
import { Bug, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

export function BugReportButton() {
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (text.length < 10) {
      toast.error("Opisz błąd w co najmniej 10 znakach.");
      return;
    }
    setSending(true);
    try {
      const pageUrl = `${window.location.pathname}${window.location.search}`.slice(0, 500);
      await api.post("/api/bug-reports", {
        message: text,
        pageUrl,
        email: isAuthenticated ? undefined : email.trim() || undefined,
      });
      toast.success("Zgłoszenie zapisane. Dziękujemy.");
      setMessage("");
      setEmail("");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Nie udało się wysłać zgłoszenia.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed z-40 right-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] md:bottom-28 md:right-6 bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95 shadow-lg"
        style={{ fontWeight: 700 }}
      >
        <Bug className="w-4 h-4 mr-2" aria-hidden />
        Zgłoś błąd
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
          <DialogHeader>
            <DialogTitle className="font-display">Zgłoś błąd</DialogTitle>
            <DialogDescription className="text-[var(--race-muted)]">
              {isAuthenticated
                ? `Zgłoszenie przypiszemy do konta ${user?.username ?? ""}.`
                : "Możesz wysłać bez konta. E-mail jest opcjonalny, jeśli chcesz, żebyśmy odpisali."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bug-message" className="text-[var(--race-fg)]">
                Co nie działa
              </Label>
              <Textarea
                id="bug-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                placeholder="Np. po zapisie na wydarzenie wraca pusta lista zgłoszeń."
                className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)] min-h-[120px]"
              />
            </div>
            {!isAuthenticated && (
              <div className="space-y-2">
                <Label htmlFor="bug-email" className="text-[var(--race-fg)]">
                  E-mail (opcjonalnie)
                </Label>
                <Input
                  id="bug-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={160}
                  autoComplete="email"
                  className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
                />
              </div>
            )}
            <DialogFooter>
              <Button
                type="submit"
                disabled={sending}
                className="bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95"
                style={{ fontWeight: 700 }}
              >
                {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Wyślij
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
