import { useEffect, useState } from "react";
import { Car, Plus, Trash2, Loader2, Pencil } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { api, ApiError } from "../lib/api";
import type { Car as GarageCar } from "../lib/types";
import { toast } from "sonner";

const emptyForm = {
  make: "",
  model: "",
  year: "",
  className: "",
  plate: "",
  imageUrl: "",
};

export function GaragePage() {
  const [cars, setCars] = useState<GarageCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadCars = () => {
    setLoading(true);
    api
      .get<GarageCar[]>("/api/garage")
      .then(setCars)
      .catch(() => setCars([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCars();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (car: GarageCar) => {
    setEditingId(car.id);
    setForm({
      make: car.make,
      model: car.model,
      year: car.year ? String(car.year) : "",
      className: car.className ?? "",
      plate: car.plate ?? "",
      imageUrl: car.imageUrl ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.make.trim() || !form.model.trim()) {
      toast.error("Marka i model są wymagane");
      return;
    }
    setSaving(true);
    const payload = {
      make: form.make.trim(),
      model: form.model.trim(),
      year: form.year ? Number(form.year) : undefined,
      className: form.className.trim() || undefined,
      plate: form.plate.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
    };
    try {
      if (editingId) {
        await api.patch(`/api/garage/${editingId}`, payload);
        toast.success("Auto zaktualizowane");
      } else {
        await api.post("/api/garage", payload);
        toast.success("Auto dodane do garażu");
      }
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      loadCars();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się zapisać auta");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/garage/${id}`);
      toast.success("Auto usunięte");
      setCars((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się usunąć auta");
    }
  };

  return (
    <div className="min-h-screen">
      <section className="bg-[#1a1a1a] border-b border-[#2a2a2a] py-12">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-['Orbitron'] text-white mb-2" style={{ fontSize: "40px", fontWeight: 900 }}>
              MÓJ <span className="text-[#FFD700]">GARAŻ</span>
            </h1>
            <p className="text-[#9ca3af]">Zarządzaj autami używanymi przy zgłoszeniach na wydarzenia.</p>
          </div>
          <Button
            onClick={openAdd}
            className="bg-[#FFD700] text-[#121212] hover:bg-[#ffd700]/90"
            style={{ fontWeight: 800 }}
          >
            <Plus className="w-4 h-4 mr-2" />
            DODAJ AUTO
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center py-16 text-[#9ca3af]">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#FFD700]" />
            Ładowanie garażu...
          </div>
        ) : cars.length === 0 ? (
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardContent className="py-16 text-center">
              <Car className="w-16 h-16 text-[#FFD700] mx-auto mb-4" />
              <p className="text-[#9ca3af] mb-6">Twój garaż jest pusty. Dodaj pierwsze auto!</p>
              <Button onClick={openAdd} className="bg-[#FFD700] text-[#121212]" style={{ fontWeight: 700 }}>
                Dodaj auto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <Card key={car.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="font-['Orbitron'] text-white flex items-center gap-2" style={{ fontWeight: 800 }}>
                    <Car className="w-5 h-5 text-[#FFD700]" />
                    {car.make} {car.model}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-[#9ca3af]">
                  {car.year && <p>Rocznik: {car.year}</p>}
                  {car.className && <p>Klasa: {car.className}</p>}
                  {car.plate && <p>Rejestracja: {car.plate}</p>}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(car)}
                      className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-[#121212]"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edytuj
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(car.id)}
                      className="border-red-900 text-red-400 hover:bg-red-950"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Usuń
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0A0A0A] border-[#2a2a2a] text-white">
          <DialogHeader>
            <DialogTitle className="font-['Orbitron']" style={{ fontWeight: 800 }}>
              {editingId ? "Edytuj auto" : "Dodaj auto"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>Marka *</Label>
              <Input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} className="bg-[#121212] border-[#2a2a2a] text-white" />
            </div>
            <div className="space-y-2">
              <Label>Model *</Label>
              <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="bg-[#121212] border-[#2a2a2a] text-white" />
            </div>
            <div className="space-y-2">
              <Label>Rocznik</Label>
              <Input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} type="number" className="bg-[#121212] border-[#2a2a2a] text-white" />
            </div>
            <div className="space-y-2">
              <Label>Klasa</Label>
              <Input value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} className="bg-[#121212] border-[#2a2a2a] text-white" />
            </div>
            <div className="space-y-2">
              <Label>Rejestracja</Label>
              <Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} className="bg-[#121212] border-[#2a2a2a] text-white" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>URL zdjęcia</Label>
              <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="bg-[#121212] border-[#2a2a2a] text-white" placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-[#2a2a2a] text-white">
              Anuluj
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#FFD700] text-[#121212]" style={{ fontWeight: 700 }}>
              {saving ? "ZAPISYWANIE..." : editingId ? "Zapisz" : "Dodaj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
