/**
 * Tab „Moje” — zgłoszenia użytkownika (dashboard).
 *
 * Rola w architekturze: chroniony RequireAuth; `/api/registrations/mine` + skrót do garażu.
 * Anulowanie zgłoszeń, upload URL dowodu płatności dla ACCEPTED + paid.
 *
 * Pomysł (alt): push statusów zgłoszenia; kamera → upload pliku zamiast URL.
 */
import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Pressable,
  TextInput,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { api, ApiError } from "../api/client";
import type { Car, Registration } from "../api/types";
import { isOpenRegistration, registrationStatusLabel } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { ScreenHeader, PrimaryButton, EmptyState, ErrorText } from "../components/ui";
import { colors } from "../theme/colors";
import type { MainTabParamList } from "../navigation/types";

export function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [regs, setRegs] = useState<Registration[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proofFor, setProofFor] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const visibleRegs = regs.filter((r) => r.status !== "CANCELED");

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    setError(null);
    try {
      const [r, g] = await Promise.all([
        api.get<Registration[]>("/api/registrations/mine"),
        api.get<Car[]>("/api/garage"),
      ]);
      setRegs(r);
      setCars(g);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Błąd ładowania");
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

  if (!user) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="MOJE" subtitle="Wymaga logowania" />
        <EmptyState text="Zaloguj się, żeby zobaczyć zgłoszenia." />
      </View>
    );
  }

  const cancel = async (id: string) => {
    try {
      await api.post(`/api/registrations/${id}/cancel`, {});
      await load(true);
    } catch (e) {
      Alert.alert("Błąd", e instanceof ApiError ? e.message : "Nie udało się anulować");
    }
  };

  const sendProof = async () => {
    if (!proofFor || !proofUrl.trim()) return;
    try {
      await api.post(`/api/registrations/${proofFor}/payment-proof`, { paymentProofUrl: proofUrl.trim() });
      setProofFor(null);
      setProofUrl("");
      await load(true);
      Alert.alert("OK", "Dowód płatności wysłany");
    } catch (e) {
      Alert.alert("Błąd", e instanceof ApiError ? e.message : "Nie udało się");
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="MOJE" subtitle={`${visibleRegs.length} zgłoszeń · ${cars.length} aut`} />
      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
      ) : error ? (
        <ErrorText text={error} />
      ) : (
        <FlatList
          data={visibleRegs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.gold} />
          }
          ListEmptyComponent={<EmptyState text="Brak aktywnych zgłoszeń — zapisz się na wydarzenie." />}
          ListHeaderComponent={
            <Pressable style={styles.linkCard} onPress={() => navigation.navigate("GarageTab")}>
              <Text style={styles.linkTitle}>Garaż ({cars.length})</Text>
              <Text style={styles.linkSub}>Zarządzaj autami →</Text>
            </Pressable>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate("EventsTab")}
              onLongPress={() => {
                if (isOpenRegistration(item.status)) {
                  Alert.alert("Anulować zgłoszenie?", "Ta operacja jest nieodwracalna.", [
                    { text: "Nie", style: "cancel" },
                    { text: "Tak, anuluj", style: "destructive", onPress: () => cancel(item.id) },
                  ]);
                }
              }}
            >
              <Text style={styles.name}>{item.event?.name || item.eventId}</Text>
              <Text style={styles.meta}>{registrationStatusLabel(item.status)}</Text>
              {item.event?.paid ? <Text style={styles.meta}>Wydarzenie płatne</Text> : null}
              {isOpenRegistration(item.status) ? (
                <Text style={styles.actionDanger}>Przytrzymaj kartę, aby anulować zgłoszenie</Text>
              ) : null}
              {item.status === "ACCEPTED" && item.event?.paid && !item.paymentProofUrl ? (
                <Pressable style={styles.action} onPress={() => setProofFor(item.id)}>
                  <Text style={styles.actionGold}>Dodaj dowód płatności</Text>
                </Pressable>
              ) : null}
            </Pressable>
          )}
          ListFooterComponent={
            proofFor ? (
              <View style={styles.proofBox}>
                <Text style={styles.name}>URL dowodu płatności</Text>
                <TextInput
                  style={styles.input}
                  value={proofUrl}
                  onChangeText={setProofUrl}
                  placeholder="https://…"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                />
                <PrimaryButton label="WYŚLIJ" onPress={sendProof} />
              </View>
            ) : null
          }
        />
      )}
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
    gap: 4,
  },
  name: { color: colors.text, fontWeight: "800" },
  meta: { color: colors.muted, fontSize: 13 },
  action: { marginTop: 8 },
  actionDanger: { color: colors.danger, fontWeight: "700", marginTop: 8 },
  actionGold: { color: colors.gold, fontWeight: "700" },
  linkCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: 14,
    marginBottom: 14,
  },
  linkTitle: { color: colors.gold, fontWeight: "900" },
  linkSub: { color: colors.muted, marginTop: 4 },
  proofBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
});
