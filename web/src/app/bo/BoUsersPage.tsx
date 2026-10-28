import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { AdminUser } from "../lib/types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { downloadBoCsv } from "./csv";

export function BoUsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "USER" | "ORGANIZER" | "ADMIN">("all");
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setUsers(await api.get<AdminUser[]>("/api/admin/users"));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się pobrać użytkowników");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchQ =
        !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchR = roleFilter === "all" || u.role === roleFilter;
      return matchQ && matchR;
    });
  }, [users, query, roleFilter]);

  const updateRole = async (id: string, role: string) => {
    try {
      const updated = await api.patch<AdminUser>(`/api/admin/users/${id}/role`, { role });
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      toast.success(`Rola: ${role}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się zmienić roli");
    }
  };

  const deleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/users/${deleteTarget.id}`);
      toast.success("Użytkownik usunięty");
      setDeleteTarget(null);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się usunąć");
    } finally {
      setDeleting(false);
    }
  };

  const exportCsv = () => {
    downloadBoCsv(
      "uzytkownicy",
      ["id", "username", "email", "role", "createdAt"],
      filtered.map((u) => [u.id, u.username, u.email, u.role, u.createdAt]),
    );
    toast.success(`CSV: ${filtered.length} wierszy`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[var(--race-muted)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--race-accent)] mr-2" />
        Ładowanie…
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl" style={{ fontWeight: 800 }}>
          Użytkownicy
        </h1>
        <Button
          type="button"
          variant="outline"
          onClick={exportCsv}
          className="border-[var(--race-accent)] text-[var(--race-accent)]"
          style={{ fontWeight: 700 }}
        >
          <Download className="w-4 h-4 mr-2" />
          Eksport CSV ({filtered.length})
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--race-muted)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj login / email…"
            className="pl-10 bg-[var(--race-card)] border-[var(--race-border)]"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
          <SelectTrigger className="w-44 bg-[var(--race-card)] border-[var(--race-border)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[var(--race-card)] border-[var(--race-border)]">
            <SelectItem value="all">Wszystkie role</SelectItem>
            <SelectItem value="USER">USER</SelectItem>
            <SelectItem value="ORGANIZER">ORGANIZER</SelectItem>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--race-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--race-card)] text-left text-[var(--race-muted)]">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Login</th>
              <th className="px-3 py-2.5 font-semibold">Email</th>
              <th className="px-3 py-2.5 font-semibold">Utworzono</th>
              <th className="px-3 py-2.5 font-semibold">Rola</th>
              <th className="px-3 py-2.5 font-semibold">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-[var(--race-muted)]">
                  Brak użytkowników
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="border-t border-[var(--race-border)] hover:bg-[var(--race-hover)]/40">
                  <td className="px-3 py-3" style={{ fontWeight: 700 }}>
                    {user.username}
                    {me?.id === user.id ? (
                      <span className="ml-2 text-xs text-[var(--race-accent)]">ty</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-[var(--race-muted)]">{user.email}</td>
                  <td className="px-3 py-3 text-[var(--race-muted)] whitespace-nowrap">
                    {user.createdAt ? new Date(user.createdAt).toLocaleString("pl-PL") : "–"}
                  </td>
                  <td className="px-3 py-3">
                    <Select
                      value={user.role}
                      onValueChange={(role) => void updateRole(user.id, role)}
                      disabled={me?.id === user.id}
                    >
                      <SelectTrigger className="w-36 h-8 bg-[var(--race-bg)] border-[var(--race-border)] disabled:opacity-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--race-card)] border-[var(--race-border)]">
                        <SelectItem value="USER">USER</SelectItem>
                        <SelectItem value="ORGANIZER">ORGANIZER</SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-3">
                    {me?.id !== user.id && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 border-red-800 text-red-400"
                        onClick={() => setDeleteTarget(user)}
                      >
                        Usuń
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
          <DialogHeader>
            <DialogTitle className="font-display">Usuń użytkownika</DialogTitle>
            <DialogDescription className="text-[var(--race-muted)]">
              Usunąć konto {deleteTarget?.username} ({deleteTarget?.email})? Zgłoszenia, auta i powiadomienia
              znikną. Wydarzenia organizatora przejdą na Ciebie.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="border-[var(--race-border)]">
              Anuluj
            </Button>
            <Button disabled={deleting} className="bg-red-700 hover:bg-red-600" onClick={() => void deleteUser()}>
              {deleting ? "Usuwanie…" : "Usuń konto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
