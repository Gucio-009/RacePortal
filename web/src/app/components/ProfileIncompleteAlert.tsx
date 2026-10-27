/**
 * Alert: konto Google bez domkniętego profilu / licencji.
 * Nie blokuje nawigacji — CTA prowadzi do /konto (poza stroną konta).
 */
import { Link, useLocation } from "react-router";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";

export function ProfileIncompleteAlert() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  if (user?.registrationComplete !== false) return null;
  const onAccountPage = pathname === "/konto";

  return (
    <div
      role="status"
      className="mb-8 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-4 sm:px-5 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
    >
      <div className="flex items-start gap-3 min-w-0">
        <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0">
          <p className="text-[var(--race-fg)] font-bold mb-1">Uzupełnij dane profilu</p>
          <p className="text-[var(--race-muted)] text-sm leading-relaxed">
            Brakuje informacji o prawie jazdy / licencji PZM. Bez tego nie zapiszesz się na część
            wydarzeń wymagających tych dokumentów.
            {onAccountPage ? " Uzupełnij sekcję poniżej i zapisz." : ""}
          </p>
        </div>
      </div>
      {!onAccountPage ? (
        <Link to="/konto" className="shrink-0 self-stretch sm:self-center">
          <Button className="w-full sm:w-auto bg-amber-500 text-black hover:bg-amber-400 font-extrabold">
            Uzupełnij w profilu
          </Button>
        </Link>
      ) : null}
    </div>
  );
}
