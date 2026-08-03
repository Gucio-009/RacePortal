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
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api/client";
import type { ApiEvent, PaginatedEvents } from "../api/types";
import { DEFAULT_IMAGE } from "../api/types";
import { ScreenHeader, GhostButton } from "../components/ui";
import { colors } from "../theme/colors";
import type { MoreStackParamList } from "../navigation/types";

export function ArchiveScreen({ title = "ARCHIWUM" }: { title?: string }) {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const [items, setItems] = useState<ApiEvent[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (p = 1, refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const res = await api.get<PaginatedEvents>(`/api/events?archive=1&page=${p}&limit=12`);
      setItems(res.items);
      setPage(res.page);
      setTotalPages(res.totalPages || 1);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load(1);
    }, [load]),
  );

  return (
    <View style={styles.root}>
      <ScreenHeader title={title} subtitle="Zakończone wydarzenia" />
      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(1, true)} tintColor={colors.gold} />
          }
          ListEmptyComponent={<Text style={styles.empty}>Brak archiwum</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate("EventDetail", { id: item.id })}
            >
              <Image source={{ uri: item.imageUrl || DEFAULT_IMAGE }} style={styles.image} />
              <View style={styles.body}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.dateLabel || item.date.slice(0, 10)} · {item.city}
                </Text>
              </View>
            </Pressable>
          )}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pager}>
                <GhostButton label="Poprzednia" onPress={() => page > 1 && load(page - 1)} />
                <Text style={styles.meta}>
                  {page}/{totalPages}
                </Text>
                <GhostButton label="Następna" onPress={() => page < totalPages && load(page + 1)} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

export function ResultsScreen() {
  return <ArchiveScreen title="WYNIKI" />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 12,
  },
  image: { width: "100%", height: 120 },
  body: { padding: 12 },
  name: { color: colors.text, fontWeight: "800" },
  meta: { color: colors.muted, marginTop: 4 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
  pager: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
});
