/**
 * Panel administratora — statystyki, eventy, aplikacje org., role użytkowników.
 *
 * Rola w architekturze: twardy role gate RequireAuth roles={ADMIN} w App.tsx
 * + lokalny check `user.role !== "ADMIN"`. Endpointy `/api/admin/*`.
 * Self-demote zablokowany w UI (nie zmieniaj swojej roli).
 *
 * Pomysł (alt): osobna web-only konsola admina; audit log zmian ról.
 */
import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Pressable,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api, ApiError } from "../api/client";
import type { AdminStats, AdminUser, ApiEvent, OrganizerApplication, UserRole } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { EmptyState, ErrorText } from "../components/ui";
import { colors } from "../theme/colors";

export function AdminScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pending, setPending] = useState<ApiEvent[]>([]);
  const [apps, setApps] = useState<OrganizerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    setError(null);
    try {
      const [s, u, p, a] = await Promise.all([
        api.get<AdminStats>("/api/admin/stats"),
        api.get<AdminUser[]>("/api/admin/users"),
        api.get<ApiEvent[]>("/api/admin/events/pending"),
        api.get<OrganizerApplication[]>("/api/admin/organizer-applications"),
      ]);
      setStats(s);
      setUsers(u);
      setPending(p);
      setApps(a);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Błąd");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user?.role !== "ADMIN") return;
      setLoading(true);
      load();
    }, [load, user]),
  );

  if (user?.role !== "ADMIN") {
    return (
      <View style={styles.root}>
        <EmptyState text="Tylko dla administratora." />
      </View>
    );
  }

  const setEventStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/api/admin/events/${id}/status`, { status });
      await load(true);
    } catch (e) {
      Alert.alert("Błąd", e instanceof ApiError ? e.message : "Nie udało się");
    }
  };

  const setRole = async (id: string, role: UserRole) => {
    try {
      await api.patch(`/api/admin/users/${id}/role`, { role });
      await load(true);
    } catch (e) {
      Alert.alert("Błąd", e instanceof ApiError ? e.message : "Nie udało się");
    }
  };

  const setApp = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      await api.patch(`/api/admin/organizer-applications/${id}`, { status });
      await load(true);
    } catch (e) {
      Alert.alert("Błąd", e instanceof ApiError ? e.message : "Nie udało się");
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.gold} />
      }
    >
      <Text style={styles.title}>Admin</Text>
      {loading ? <ActivityIndicator color={colors.gold} /> : null}
      {error ? <ErrorText text={error} /> : null}
      {stats ? (
        <View style={styles.card}>
          <Text style={styles.line}>Użytkownicy: {stats.users}</Text>
          <Text style={styles.line}>Eventy: {stats.events}</Text>
          <Text style={styles.line}>Oczekujące eventy: {stats.pendingEvents}</Text>
          <Text style={styles.line}>Zgłoszenia: {stats.registrations}</Text>
          <Text style={styles.line}>Aplikacje org.: {stats.pendingApps}</Text>
        </View>
      ) : null}

      <Text style={styles.section}>Oczekujące wydarzenia</Text>
      {pending.map((ev) => (
        <View key={ev.id} style={styles.card}>
          <Text style={styles.name}>{ev.name}</Text>
          <Text style={styles.meta}>{ev.organizer?.username || "—"}</Text>
          <View style={styles.row}>
            <Pressable onPress={() => setEventStatus(ev.id, "APPROVED")}>
              <Text style={styles.ok}>Zatwierdź</Text>
            </Pressable>
            <Pressable onPress={() => setEventStatus(ev.id, "REJECTED")}>
              <Text style={styles.bad}>Odrzuć</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <Text style={styles.section}>Aplikacje organizatora</Text>
      {apps
        .filter((a) => a.status === "PENDING")
        .map((a) => (
          <View key={a.id} style={styles.card}>
            <Text style={styles.name}>{a.company}</Text>
            <Text style={styles.meta}>{a.user?.email || a.userId}</Text>
            <Text style={styles.meta}>{a.message}</Text>
            <View style={styles.row}>
              <Pressable onPress={() => setApp(a.id, "APPROVED")}>
                <Text style={styles.ok}>Akceptuj</Text>
              </Pressable>
              <Pressable onPress={() => setApp(a.id, "REJECTED")}>
                <Text style={styles.bad}>Odrzuć</Text>
              </Pressable>
            </View>
          </View>
        ))}

      <Text style={styles.section}>Użytkownicy</Text>
      {users.map((u) => (
        <View key={u.id} style={styles.card}>
          <Text style={styles.name}>
            {u.username} · {u.role}
          </Text>
          <Text style={styles.meta}>{u.email}</Text>
          {u.id !== user.id ? (
            <View style={styles.row}>
              {(["USER", "ORGANIZER", "ADMIN"] as UserRole[]).map((role) => (
                <Pressable key={role} onPress={() => setRole(u.id, role)} disabled={u.role === role}>
                  <Text style={[styles.chip, u.role === role && styles.chipOn]}>{role}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.meta}>To Ty — nie zmieniaj swojej roli tutaj</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 22, fontWeight: "900", marginBottom: 12 },
  section: { color: colors.gold, fontWeight: "800", marginTop: 18, marginBottom: 8 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
    gap: 4,
  },
  name: { color: colors.text, fontWeight: "800" },
  meta: { color: colors.muted, fontSize: 13 },
  line: { color: colors.text },
  row: { flexDirection: "row", gap: 12, marginTop: 8, flexWrap: "wrap" },
  ok: { color: colors.gold, fontWeight: "700" },
  bad: { color: colors.danger, fontWeight: "700" },
  chip: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  chipOn: { color: colors.gold },
});
