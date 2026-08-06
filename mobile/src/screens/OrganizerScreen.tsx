/**
 * Panel organizatora — CRUD eventów + zarządzanie zgłoszeniami.
 *
 * Rola w architekturze: gate ORGANIZER|ADMIN; API `/api/organizer/events`,
 * tworzenie/edycja `/api/events`, statusy zgłoszeń. Nowe eventy czekają na admina.
 *
 * Pomysł (alt): kreator wielokrokowy; mapa toru z OSRM jak na webie; Flutter admin lite.
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
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api, ApiError } from "../api/client";
import type { ApiEvent, Registration } from "../api/types";
import { eventStatusLabel, registrationStatusLabel } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { Field, PrimaryButton, GhostButton, ToggleRow, EmptyState, ErrorText } from "../components/ui";
import { colors } from "../theme/colors";

const emptyForm = {
  name: "",
  description: "",
  category: "Track Day",
  date: "",
  time: "10:00",
  track: "",
  city: "",
  voivodeship: "wielkopolskie",
  paid: false,
  entryFee: "",
  bankAccount: "",
  acceptRegistrations: true,
};

export function OrganizerScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [regsFor, setRegsFor] = useState<string | null>(null);
  const [regs, setRegs] = useState<Registration[]>([]);

  const can = user?.role === "ORGANIZER" || user?.role === "ADMIN";

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    setError(null);
    try {
      setEvents(await api.get<ApiEvent[]>("/api/organizer/events"));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Błąd");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!can) return;
      setLoading(true);
      load();
    }, [load, can]),
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (ev: ApiEvent) => {
    setEditingId(ev.id);
    setForm({
      name: ev.name,
      description: ev.description,
      category: ev.category,
      date: ev.date.slice(0, 10),
      time: ev.time || "10:00",
      track: ev.track,
      city: ev.city,
      voivodeship: ev.voivodeship,
      paid: Boolean(ev.paid),
      entryFee: ev.entryFee != null ? String(ev.entryFee) : "",
      bankAccount: ev.bankAccount || "",
      acceptRegistrations: ev.acceptRegistrations !== false,
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.date || !form.track.trim() || !form.city.trim()) {
      Alert.alert("Walidacja", "Uzupełnij wymagane pola");
      return;
    }
    if (form.paid && !form.bankAccount.trim()) {
      Alert.alert("Walidacja", "Dla płatnego wydarzenia podaj konto bankowe");
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      date: form.date,
      time: form.time,
      track: form.track.trim(),
      city: form.city.trim(),
      voivodeship: form.voivodeship.trim(),
      paid: form.paid,
      entryFee: form.paid && form.entryFee ? Number(form.entryFee) : undefined,
      bankAccount: form.paid ? form.bankAccount.trim() : undefined,
      acceptRegistrations: form.acceptRegistrations,
      freeCancelDays: 7,
      paymentDeadlineHours: form.paid ? 72 : undefined,
      requireDrivingLicense: false,
      requirePzmLicense: false,
      requireOc: false,
      requirePt: false,
      requireCage: false,
      requireRegistered: false,
    };
    setBusy(true);
    try {
      if (editingId) await api.patch(`/api/events/${editingId}`, payload);
      else await api.post("/api/events", payload);
      setModal(false);
      await load(true);
      if (!editingId) Alert.alert("OK", "Wydarzenie utworzone — czeka na akceptację admina");
    } catch (e) {
      Alert.alert("Błąd", e instanceof ApiError ? e.message : "Nie udało się zapisać");
    } finally {
      setBusy(false);
    }
  };

  const cancelEvent = async (id: string) => {
    try {
      await api.post(`/api/events/${id}/cancel`, {});
      await load(true);
    } catch (e) {
      Alert.alert("Błąd", e instanceof ApiError ? e.message : "Nie udało się anulować");
    }
  };

  const openRegs = async (eventId: string) => {
    setRegsFor(eventId);
    try {
      setRegs(await api.get<Registration[]>(`/api/registrations/event/${eventId}`));
    } catch (e) {
      Alert.alert("Błąd", e instanceof ApiError ? e.message : "Nie udało się pobrać zgłoszeń");
      setRegsFor(null);
    }
  };

  const setRegStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/api/registrations/${id}/status`, { status });
      if (regsFor) setRegs(await api.get<Registration[]>(`/api/registrations/event/${regsFor}`));
    } catch (e) {
      Alert.alert("Błąd", e instanceof ApiError ? e.message : "Nie udało się");
    }
  };

  if (!can) {
    return (
      <View style={styles.root}>
        <EmptyState text="Panel organizatora — wymagana rola ORGANIZER lub ADMIN." />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.gold} />
        }
      >
        <View style={styles.top}>
          <Text style={styles.title}>Organizator</Text>
          <GhostButton label="+ Event" onPress={openCreate} />
        </View>
        {loading ? <ActivityIndicator color={colors.gold} /> : null}
        {error ? <ErrorText text={error} /> : null}
        {events.length === 0 && !loading ? <EmptyState text="Brak Twoich wydarzeń." /> : null}
        {events.map((ev) => (
          <View key={ev.id} style={styles.card}>
            <Text style={styles.name}>{ev.name}</Text>
            <Text style={styles.meta}>
              {eventStatusLabel(ev.status)} · {ev.date.slice(0, 10)} · zgłoszeń:{" "}
              {ev._count?.registrations ?? ev.registrationsCount ?? "—"}
            </Text>
            <View style={styles.row}>
              <Pressable onPress={() => openEdit(ev)}>
                <Text style={styles.link}>Edytuj</Text>
              </Pressable>
              <Pressable onPress={() => openRegs(ev.id)}>
                <Text style={styles.link}>Zgłoszenia</Text>
              </Pressable>
              {ev.status !== "CANCELLED" && ev.status !== "ARCHIVED" ? (
                <Pressable onPress={() => cancelEvent(ev.id)}>
                  <Text style={styles.bad}>Anuluj</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modal} animationType="slide">
        <ScrollView style={styles.modal} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          <Text style={styles.modalTitle}>{editingId ? "Edytuj wydarzenie" : "Nowe wydarzenie"}</Text>
          <Field label="Nazwa *" value={form.name} onChangeText={(name) => setForm((f) => ({ ...f, name }))} />
          <Field label="Opis *" multiline value={form.description} onChangeText={(description) => setForm((f) => ({ ...f, description }))} />
          <Field label="Kategoria *" value={form.category} onChangeText={(category) => setForm((f) => ({ ...f, category }))} />
          <Field label="Data YYYY-MM-DD *" value={form.date} onChangeText={(date) => setForm((f) => ({ ...f, date }))} />
          <Field label="Godzina" value={form.time} onChangeText={(time) => setForm((f) => ({ ...f, time }))} />
          <Field label="Tor *" value={form.track} onChangeText={(track) => setForm((f) => ({ ...f, track }))} />
          <Field label="Miasto *" value={form.city} onChangeText={(city) => setForm((f) => ({ ...f, city }))} />
          <Field label="Województwo *" value={form.voivodeship} onChangeText={(voivodeship) => setForm((f) => ({ ...f, voivodeship }))} />
          <ToggleRow label="Płatne" value={form.paid} onChange={(paid) => setForm((f) => ({ ...f, paid }))} />
          {form.paid ? (
            <>
              <Field label="Wpisowe PLN" keyboardType="decimal-pad" value={form.entryFee} onChangeText={(entryFee) => setForm((f) => ({ ...f, entryFee }))} />
              <Field label="Konto bankowe *" value={form.bankAccount} onChangeText={(bankAccount) => setForm((f) => ({ ...f, bankAccount }))} />
            </>
          ) : null}
          <ToggleRow label="Przyjmuj zgłoszenia" value={form.acceptRegistrations} onChange={(acceptRegistrations) => setForm((f) => ({ ...f, acceptRegistrations }))} />
          <PrimaryButton label="ZAPISZ" onPress={save} busy={busy} />
          <GhostButton label="Anuluj" onPress={() => setModal(false)} />
        </ScrollView>
      </Modal>

      <Modal visible={Boolean(regsFor)} animationType="slide">
        <ScrollView style={styles.modal} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          <Text style={styles.modalTitle}>Zgłoszenia</Text>
          {regs.map((r) => {
            const paid = Boolean(r.event?.paid);
            return (
              <View key={r.id} style={styles.card}>
                <Text style={styles.name}>{r.user?.username || r.userId}</Text>
                <Text style={styles.meta}>{registrationStatusLabel(r.status)}</Text>
                {r.paymentProofUrl ? <Text style={styles.meta}>Dowód: {r.paymentProofUrl}</Text> : null}
                <View style={styles.row}>
                  {r.status === "PENDING" ? (
                    <>
                      <Pressable onPress={() => setRegStatus(r.id, paid ? "ACCEPTED" : "CONFIRMED")}>
                        <Text style={styles.link}>{paid ? "Akceptuj" : "Potwierdź"}</Text>
                      </Pressable>
                      <Pressable onPress={() => setRegStatus(r.id, "CANCELED")}>
                        <Text style={styles.bad}>Odrzuć</Text>
                      </Pressable>
                    </>
                  ) : null}
                  {r.status === "ACCEPTED" ? (
                    <>
                      <Pressable onPress={() => setRegStatus(r.id, "CONFIRMED")}>
                        <Text style={styles.link}>Potwierdź płatność</Text>
                      </Pressable>
                      <Pressable onPress={() => setRegStatus(r.id, "CANCELED")}>
                        <Text style={styles.bad}>Odrzuć</Text>
                      </Pressable>
                    </>
                  ) : null}
                </View>
              </View>
            );
          })}
          <GhostButton label="Zamknij" onPress={() => setRegsFor(null)} />
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { color: colors.text, fontSize: 22, fontWeight: "900" },
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
  row: { flexDirection: "row", gap: 14, marginTop: 8, flexWrap: "wrap" },
  link: { color: colors.gold, fontWeight: "700" },
  bad: { color: colors.danger, fontWeight: "700" },
  modal: { flex: 1, backgroundColor: colors.bg },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: "900", marginBottom: 12, marginTop: 40 },
});
