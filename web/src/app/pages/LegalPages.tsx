import { Link } from "react-router";
import { Button } from "../components/ui/button";

function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <section className="border-b border-[#2a2a2a] bg-[#1a1a1a] py-16">
        <div className="container mx-auto px-4">
          <h1 className="font-['Orbitron'] text-white" style={{ fontSize: "40px", fontWeight: 900 }}>
            {title}
          </h1>
        </div>
      </section>
      <section className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 space-y-4 text-[#9ca3af] leading-relaxed">
          {children}
        </div>
        <div className="mt-8">
          <Link to="/register">
            <Button className="bg-[var(--race-accent)] text-[#121212] hover:brightness-95" style={{ fontWeight: 700 }}>
              Wróć do rejestracji
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

export function TermsPage() {
  return (
    <LegalLayout title="REGULAMIN">
      <p style={{ fontWeight: 700 }} className="text-white">
        §1. Postanowienia ogólne
      </p>
      <p>
        Serwis RACEPORTAL umożliwia przeglądanie kalendarza wydarzeń motoryzacyjnych, wyników oraz galerii.
        Korzystanie z konta użytkownika oznacza akceptację niniejszego regulaminu.
      </p>
      <p style={{ fontWeight: 700 }} className="text-white">
        §2. Konto użytkownika
      </p>
      <p>
        Użytkownik zobowiązuje się podawać prawdziwe dane, chronić dane logowania oraz nie wykorzystywać serwisu
        do działań niezgodnych z prawem.
      </p>
      <p style={{ fontWeight: 700 }} className="text-white">
        §3. Treści i wydarzenia
      </p>
      <p>
        Informacje o wydarzeniach mają charakter informacyjny. Organizatorzy mogą zmieniać terminy i warunki
        udziału niezależnie od RACEPORTAL.
      </p>
      <p style={{ fontWeight: 700 }} className="text-white">
        §4. Kontakt
      </p>
      <p>W sprawach regulaminu: kontakt@raceportal.pl</p>
    </LegalLayout>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout title="POLITYKA PRYWATNOŚCI">
      <p style={{ fontWeight: 700 }} className="text-white">
        1. Administrator danych
      </p>
      <p>Administratorem danych jest RACEPORTAL. Dane przetwarzamy w celu obsługi konta i działania serwisu.</p>
      <p style={{ fontWeight: 700 }} className="text-white">
        2. Zakres danych
      </p>
      <p>
        Przetwarzamy wyłącznie dane niezbędne do działania serwisu: nazwę użytkownika, adres email, role konta,
        dane pojazdów w garażu, zgłoszenia na wydarzenia oraz dane wydarzeń podawane przez organizatorów.
        Token sesji przechowywany jest lokalnie w przeglądarce (JWT).
      </p>
      <p style={{ fontWeight: 700 }} className="text-white">
        3. Prawa użytkownika
      </p>
      <p>
        Masz prawo dostępu do danych, ich poprawienia oraz usunięcia konta. W sprawach RODO: rodo@raceportal.pl.
      </p>
      <p style={{ fontWeight: 700 }} className="text-white">
        4. Kontakt
      </p>
      <p>rodo@raceportal.pl</p>
    </LegalLayout>
  );
}
