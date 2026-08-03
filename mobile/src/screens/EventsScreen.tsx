import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api/client";
import type { ApiEvent, PaginatedEvents } from "../api/types";
import { DEFAULT_IMAGE } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { ScreenHeader, GhostButton } from "../components/ui";
import { colors } from "../theme/colors";
import type { EventsStackParamList } from "../navigation/types";

export function EventsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EventsStackParamList>>();
  const { user, logout } = useAuth();
  const [items, setItems] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [paid, setPaid] = useState<"all" | "true" | "false">("all");
  const [category, setCategory] = useState("");

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      setError(null);
      try {
        const params = new URLSearchParams({ limit: "40", page: "1" });
        if (q.trim()) params.set("q", q.trim());
        if (paid !== "all") params.set("paid", paid);
        if (category.trim()) params.set("category", category.trim());
        const res = await api.get<PaginatedEvents>(`/api/events?${params}`);
        setItems(res.items);
      } catch {
        setError("Nie udało się pobrać wydarzeń. Czy API działa?");
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [q, paid, category],
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="WYDARZENIA"
        subtitle={user?.username ?? "Gość"}
        right={user ? <GhostButton label="Wyloguj" onPress={logout} /> : null}
      />

      <View style={styles.filters}>
        <TextInput
          style={styles.search}
          placeholder="Szukaj…"
          placeholderTextColor={colors.muted}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => load()}
          returnKeyType="search"
        />
        <View style={styles.chips}>
          {(
            [
              ["all", "Wszystkie"],
              ["false", "Darmowe"],
              ["true", "Płatne"],
            ] as const
          ).map(([value, label]) => (
            <Pressable
              key={value}
              style={[styles.chip, paid === value && styles.chipOn]}
              onPress={() => setPaid(value)}
            >
              <Text style={[styles.chipText, paid === value && styles.chipTextOn]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={styles.search}
          placeholder="Kategoria (np. Drift)"
          placeholderTextColor={colors.muted}
          value={category}
          onChangeText={setCategory}
          onSubmitEditing={() => load()}
        />
        <GhostButton label="Filtruj" onPress={() => load()} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.gold} />
          }
          ListEmptyComponent={<Text style={styles.empty}>Brak nadchodzących wydarzeń</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate("EventDetail", { id: item.id })}
            >
              <Image source={{ uri: item.imageUrl || DEFAULT_IMAGE }} style={styles.image} />
              <View style={styles.cardBody}>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.meta}>
                  {item.dateLabel || item.date.slice(0, 10)} · {item.track}
                </Text>
                <Text style={styles.meta}>
                  {item.city}, {item.voivodeship}
                  {item.paid ? " · płatne" : " · darmowe"}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  filters: { padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  search: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chips: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipOn: { borderColor: colors.gold, backgroundColor: "#2a2500" },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  chipTextOn: { color: colors.gold },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 12,
  },
  image: { width: "100%", height: 140 },
  cardBody: { padding: 14, gap: 4 },
  category: { color: colors.gold, fontWeight: "800", fontSize: 12 },
  name: { color: colors.text, fontWeight: "800", fontSize: 16 },
  meta: { color: colors.muted, fontSize: 13 },
  error: { color: colors.danger, textAlign: "center", marginTop: 40, paddingHorizontal: 24 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
});
