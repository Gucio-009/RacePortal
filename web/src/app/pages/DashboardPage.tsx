import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Calendar, MapPin, Clock, Car, Trophy, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { api } from "../lib/api";
import type { Car as GarageCar, Registration } from "../lib/types";
import { registrationStatusLabel, eventDateLabel } from "../lib/types";
import { toast } from "sonner";

export function DashboardPage() {
  const { user, updateProfile } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [username, setUsername] = useState(user?.username ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar ?? "");
  const [saving, setSaving] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [cars, setCars] = useState<GarageCar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Registration[]>("/api/registrations/mine"),
      api.get<GarageCar[]>("/api/garage"),
    ])
      .then(([regs, garageCars]) => {
        setRegistrations(regs);
        setCars(garageCars);
      })
      .catch(() => {
        setRegistrations([]);
        setCars([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const upcomingRegistrations = registrations.filter(
    (r) => r.event && r.event.status === "APPROVED" && new Date(r.event.date) >= new Date(),
  );

  const openEdit = () => {
    setUsername(user?.username ?? "");
    setAvatarUrl(user?.avatar ?? "");
    setEditOpen(true);
  };

  const saveProfile = async () => {
    if (!username.trim()) {
      toast.error("Nazwa użytkownika nie może być pusta");
      return;
    }
    setSaving(true);
    const result = await updateProfile({
      username: username.trim(),
      avatar: avatarUrl.trim() || undefined,
    });
    setSaving(false);
    if (result.ok) {
      toast.success("Profil zaktualizowany");
      setEditOpen(false);
    } else {
      toast.error(result.message || "Nie udało się zaktualizować profilu");
    }
  };

  const roleBadge =
    user?.role === "ADMIN"
      ? "ADMIN"
      : user?.role === "ORGANIZER"
        ? "ORGANIZATOR"
        : "KIEROWCA";

  return (
    <div className="min-h-screen bg-[#121212]">
      <div
        className="h-48 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(18, 18, 18, 0.7), rgba(18, 18, 18, 0.9)), url('https://images.unsplash.com/photo-1638909469623-4fdd7758414b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920')`,
        }}
      />

      <div className="container mx-auto px-4 -mt-20 pb-16">
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="w-32 h-32 border-4 border-[#FFD700]">
                <AvatarImage src={user?.avatar ?? undefined} alt={user?.username} />
                <AvatarFallback className="bg-[#FFD700] text-[#121212]" style={{ fontSize: "48px", fontWeight: 900 }}>
                  {user?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <h1 className="font-['Orbitron'] text-white mb-2" style={{ fontSize: "32px", fontWeight: 900 }}>
                  {user?.username}
                </h1>
                <p className="text-[#9ca3af] mb-4" style={{ fontSize: "16px" }}>
                  {user?.email}
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <Badge className="bg-[#FFD700] text-[#121212]" style={{ fontWeight: 700 }}>
                    <Trophy className="w-4 h-4 mr-1" />
                    {roleBadge}
                  </Badge>
                  <Badge variant="outline" className="border-[#2a2a2a] text-white">
                    Członek od {user?.memberSince ?? "2026"}
                  </Badge>
                </div>
              </div>

              <Button
                onClick={openEdit}
                className="bg-[#FFD700] text-[#121212] hover:bg-[#ffd700]/90"
                style={{ fontWeight: 700 }}
              >
                EDYTUJ PROFIL
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardContent className="pt-6 text-center">
              <Calendar className="w-12 h-12 text-[#FFD700] mx-auto mb-3" />
              <div className="font-['Orbitron'] text-[#FFD700] mb-1" style={{ fontSize: "36px", fontWeight: 900 }}>
                {upcomingRegistrations.length}
              </div>
              <p className="text-[#9ca3af]" style={{ fontWeight: 600 }}>
                Nadchodzące starty
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardContent className="pt-6 text-center">
              <Car className="w-12 h-12 text-[#FFD700] mx-auto mb-3" />
              <div className="font-['Orbitron'] text-[#FFD700] mb-1" style={{ fontSize: "36px", fontWeight: 900 }}>
                {cars.length}
              </div>
              <p className="text-[#9ca3af]" style={{ fontWeight: 600 }}>
                Auta w garażu
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardContent className="pt-6 text-center">
              <Trophy className="w-12 h-12 text-[#FFD700] mx-auto mb-3" />
              <div className="font-['Orbitron'] text-[#FFD700] mb-1" style={{ fontSize: "36px", fontWeight: 900 }}>
                {registrations.length}
              </div>
              <p className="text-[#9ca3af]" style={{ fontWeight: 600 }}>
                Wszystkie zgłoszenia
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle
                className="font-['Orbitron'] text-white flex items-center gap-2"
                style={{ fontSize: "24px", fontWeight: 800 }}
              >
                <Calendar className="w-6 h-6 text-[#FFD700]" />
                Moje zgłoszenia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-[#9ca3af]">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#FFD700]" />
                  Ładowanie...
                </div>
              ) : registrations.length === 0 ? (
                <p className="text-[#9ca3af] text-center py-8">Brak zgłoszeń. Zapisz się na wydarzenie!</p>
              ) : (
                registrations.map((reg, idx) => (
                  <div key={reg.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className={
                              reg.status === "APPROVED"
                                ? "bg-[#FFD700] text-[#121212]"
                                : "bg-[#2a2a2a] text-white"
                            }
                            style={{ fontWeight: 700, fontSize: "12px" }}
                          >
                            {registrationStatusLabel(reg.status)}
                          </Badge>
                          {reg.event && (
                            <span className="text-[#9ca3af]" style={{ fontSize: "14px" }}>
                              {eventDateLabel(reg.event)}
                            </span>
                          )}
                        </div>
                        <h4 className="text-white mb-1" style={{ fontWeight: 700 }}>
                          {reg.event?.name ?? "Wydarzenie"}
                        </h4>
                        {reg.event && (
                          <div className="flex items-center gap-4 text-[#9ca3af]" style={{ fontSize: "14px" }}>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {reg.event.track}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {reg.event.time}
                            </div>
                          </div>
                        )}
                        {reg.car && (
                          <p className="text-[#9ca3af] text-sm mt-1">
                            Auto: {reg.car.make} {reg.car.model}
                          </p>
                        )}
                      </div>
                      {reg.event && (
                        <Link to={`/wydarzenia/${reg.event.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-[#121212]"
                            style={{ fontWeight: 700 }}
                          >
                            SZCZEGÓŁY
                          </Button>
                        </Link>
                      )}
                    </div>
                    {idx < registrations.length - 1 && <Separator className="bg-[#2a2a2a] mt-4" />}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle
                className="font-['Orbitron'] text-white flex items-center gap-2"
                style={{ fontSize: "24px", fontWeight: 800 }}
              >
                <Car className="w-6 h-6 text-[#FFD700]" />
                Mój garaż
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cars.length === 0 ? (
                <p className="text-[#9ca3af] text-center py-8">Brak aut w garażu.</p>
              ) : (
                cars.map((car, idx) => (
                  <div key={car.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white" style={{ fontWeight: 700 }}>
                          {car.make} {car.model}
                        </h4>
                        <p className="text-[#9ca3af] text-sm">
                          {car.year ?? "—"}
                          {car.className ? ` · ${car.className}` : ""}
                        </p>
                      </div>
                    </div>
                    {idx < cars.length - 1 && <Separator className="bg-[#2a2a2a] mt-4" />}
                  </div>
                ))
              )}
              <Link to="/garaz">
                <Button variant="ghost" className="w-full text-[#FFD700] hover:bg-[#2a2a2a]" style={{ fontWeight: 700 }}>
                  Zarządzaj garażem
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#0A0A0A] border-[#2a2a2a] text-white">
          <DialogHeader>
            <DialogTitle className="font-['Orbitron']" style={{ fontWeight: 800 }}>
              Edytuj profil
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex justify-center">
              <Avatar className="w-24 h-24 border-2 border-[#FFD700]">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-[#FFD700] text-[#121212]">
                  {username?.charAt(0)?.toUpperCase() || "R"}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Nazwa użytkownika</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-[#121212] border-[#2a2a2a] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">URL awatara</Label>
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="bg-[#121212] border-[#2a2a2a] text-white"
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="border-[#2a2a2a] text-white">
              Anuluj
            </Button>
            <Button
              onClick={saveProfile}
              disabled={saving}
              className="bg-[#FFD700] text-[#121212] hover:bg-[#ffd700]/90"
              style={{ fontWeight: 700 }}
            >
              {saving ? "ZAPISYWANIE..." : "Zapisz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
