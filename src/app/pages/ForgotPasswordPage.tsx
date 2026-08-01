import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Flag, Mail, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await forgotPassword(email);
      if (result.ok) {
        setSent(true);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(18, 18, 18, 0.9), rgba(18, 18, 18, 0.9)), url('https://images.unsplash.com/photo-1617130644016-d318045a3958?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920')`,
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Flag className="w-16 h-16 text-[#FFD700] mx-auto mb-4" />
          <h1 className="font-['Orbitron'] text-white mb-2" style={{ fontSize: "32px", fontWeight: 900 }}>
            RESET <span className="text-[#FFD700]">HASŁA</span>
          </h1>
          <p className="text-[#9ca3af]">Podaj email powiązany z kontem</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-white" style={{ fontWeight: 600 }}>
                Sprawdź skrzynkę
              </p>
              <p className="text-[#9ca3af]" style={{ fontSize: "14px" }}>
                Jeśli konto z adresem <span className="text-[#FFD700]">{email}</span> istnieje, wysłaliśmy instrukcję
                resetu hasła.
              </p>
              <Link to="/login">
                <Button className="w-full bg-[#FFD700] text-[#121212] hover:bg-[#ffd700]/90 h-12" style={{ fontWeight: 800 }}>
                  Wróć do logowania
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white" style={{ fontWeight: 600 }}>
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="twoj@email.com"
                    className="pl-10 bg-[#121212] border-[#2a2a2a] text-white h-12"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#FFD700] text-[#121212] hover:bg-[#ffd700]/90 h-12"
                style={{ fontWeight: 800 }}
              >
                {isLoading ? "WYSYŁANIE..." : "WYŚLIJ LINK"}
              </Button>
              <Link to="/login" className="flex items-center justify-center gap-2 text-[#9ca3af] hover:text-[#FFD700]">
                <ArrowLeft className="w-4 h-4" />
                Wróć do logowania
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
