import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api, ApiError } from "../api/client";
import type { Car } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { ScreenHeader, PrimaryButton, GhostButton, Field, ToggleRow, EmptyState, ErrorText } from "../components/ui";
import { colors } from "../theme/colors";

const emptyForm = {
  make: "",
  model: "",
  year: "",
  className: "",
  plate: "",
  driveType: "",
  powerHp: "",
  engineCc: "",
  weightKg: "",
  registered: false,
  registrationType: "",
  kssNumber: "",
  hasRollCage: false,
  hasOc: false,
  hasPt: false,
  modifications: "",
};

export function GarageScreen() {
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    setError(null);
    try {
      setCars(await api.get<Car[]>("/api/garage"));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Błąd");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
      load();
    }, [load, user]),
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (car: Car) => {
    setEditingId(car.id);
    setForm({
      make: car.make,
      model: car.model,
      year: car.year != null ? String(car.year) : "",
      className: car.className || "",
      plate: car.plate || "",
      driveType: car.driveType || "",
      powerHp: car.powerHp != null ? String(car.powerHp) : "",
      engineCc: car.engineCc != null ? String(car.engineCc) : "",
      weightKg: car.weightKg != null ? String(car.weightKg) : "",
      registered: Boolean(car.registered),
      registrationType: car.registrationType || "",
      kssNumber: car.kssNumber || "",
      hasRollCage: Boolean(car.hasRollCage),
      hasOc: Boolean(car.hasOc),
      hasPt: Boolean(car.hasPt),
      modifications: car.modifications || "",
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.make.trim() || !form.model.trim()) {
      Alert.alert("Walidacja", "Marka i model są wymagane");
      return;
    }
    const payload = {
      make: form.make.trim(),
      model: form.model.trim(),
      year: form.year ? Number(form.year) : undefined,
      className: form.className.trim() || undefined,
      plate: form.plate.trim() || undefined,
      driveType: form.driveType.trim() || undefined,
      powerHp: form.powerHp ? Number(form.powerHp) : undefined,
      engineCc: form.engineCc ? Number(form.engineCc) : undefined,
      weightKg: form.weightKg ? Number(form.weightKg) : undefined,
      registered: form.registered,
      registrationType: form.registered ? form.registrationType || undefined : undefined,
      kssNumber: form.registered ? form.kssNumber || undefined : undefined,
      hasRollCage: form.hasRollCage,
      hasOc: form.hasOc,
      hasPt: form.hasPt,
      modifications: form.modifications.trim() || undefined,
    };
    setBusy(true);
    try {
      if (editingId) await api.patch(`/api/garage/${editingId}`, payload);
      else await api.post("/api/garage", payload);
      setModal(false);
      await load(true);
    } catch (e) {
      Alert.alert("Błąd", e instanceof ApiError ? e.message : "Nie udało się zapisać");
    } finally {
      setBusy(false);
    }
  };

  const remove = (id: string) => {
    Alert.alert("Usuń auto", "Na pewno?", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/garage/${id}`);
            await load(true);
          } catch (e) {
            Alert.alert("Błąd", e instanceof ApiError ? e.message : "Nie udało się usunąć");
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="GARAŻ" />
        <EmptyState text="Zaloguj się, żeby zarządzać autami." />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="GARAŻ"
        subtitle={`${cars.length} aut`}
        right={<GhostButton label="+ Auto" onPress={openCreate} />}
      />
      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
      ) : error ? (
        <ErrorText text={error} />
      ) : (
        <FlatList
          data={cars}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.gold} />
          }
          ListEmptyComponent={<EmptyState text="Brak aut — dodaj pierwsze." />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>
                {item.make} {item.model}
              </Text>
              <Text style={styles.meta}>
                {[item.year, item.className, item.plate].filter(Boolean).join(" · ") || "—"}
              </Text>
              <View style={styles.row}>
                <GhostButton label="Edytuj" onPress={() => openEdit(item)} />
                <GhostButton label="Usuń" danger onPress={() => remove(item.id)} />
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modal} animationType="slide">
        <ScrollView style={styles.modal} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          <Text style={styles.modalTitle}>{editingId ? "Edytuj auto" : "Nowe auto"}</Text>
          <Field label="Marka *" value={form.make} onChangeText={(make) => setForm((f) => ({ ...f, make }))} />
          <Field label="Model *" value={form.model} onChangeText={(model) => setForm((f) => ({ ...f, model }))} />
          <Field label="Rok" keyboardType="number-pad" value={form.year} onChangeText={(year) => setForm((f) => ({ ...f, year }))} />
          <Field label="Klasa" value={form.className} onChangeText={(className) => setForm((f) => ({ ...f, className }))} />
          <Field label="Rejestracja" value={form.plate} onChangeText={(plate) => setForm((f) => ({ ...f, plate }))} />
          <Field label="Napęd (FWD/RWD/AWD)" value={form.driveType} onChangeText={(driveType) => setForm((f) => ({ ...f, driveType }))} />
          <Field label="KM" keyboardType="number-pad" value={form.powerHp} onChangeText={(powerHp) => setForm((f) => ({ ...f, powerHp }))} />
          <Field label="Pojemność cm³" keyboardType="number-pad" value={form.engineCc} onChangeText={(engineCc) => setForm((f) => ({ ...f, engineCc }))} />
          <Field label="Masa kg" keyboardType="number-pad" value={form.weightKg} onChangeText={(weightKg) => setForm((f) => ({ ...f, weightKg }))} />
          <ToggleRow label="Zarejestrowany" value={form.registered} onChange={(registered) => setForm((f) => ({ ...f, registered }))} />
          {form.registered ? (
            <>
              <Field label="Typ (cywilne/sportowe)" value={form.registrationType} onChangeText={(registrationType) => setForm((f) => ({ ...f, registrationType }))} />
              <Field label="Nr KSS" value={form.kssNumber} onChangeText={(kssNumber) => setForm((f) => ({ ...f, kssNumber }))} />
            </>
          ) : null}
          <ToggleRow label="Klatka" value={form.hasRollCage} onChange={(hasRollCage) => setForm((f) => ({ ...f, hasRollCage }))} />
          <ToggleRow label="OC" value={form.hasOc} onChange={(hasOc) => setForm((f) => ({ ...f, hasOc }))} />
          <ToggleRow label="PT" value={form.hasPt} onChange={(hasPt) => setForm((f) => ({ ...f, hasPt }))} />
          <Field label="Modyfikacje" multiline value={form.modifications} onChangeText={(modifications) => setForm((f) => ({ ...f, modifications }))} />
          <PrimaryButton label="ZAPISZ" onPress={save} busy={busy} />
          <GhostButton label="Anuluj" onPress={() => setModal(false)} />
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  name: { color: colors.text, fontWeight: "800", fontSize: 16 },
  meta: { color: colors.muted },
  row: { flexDirection: "row", gap: 10, marginTop: 8 },
  modal: { flex: 1, backgroundColor: colors.bg },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: "900", marginBottom: 12, marginTop: 40 },
});
