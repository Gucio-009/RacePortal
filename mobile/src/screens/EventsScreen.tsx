/**
 * Lista wydarzeń — filtry, tryby Lista / Kalendarz / Mapa.
 *
 * Rola w architekturze: główny ekran publiczny (tab Eventy). Query do
 * `/api/events` (lista) lub `/api/events/markers` (kalendarz/mapa) z tymi samymi
 * filtrami co web: q, paid, category, województwo, miasto, tor, daty, carId (garaż).
 * Mapa: lista markerów + deep-link do Apple Maps / geo: (Leaflet WebView opcjonalnie później).
 *
 * Technologie: FlatList, useFocusEffect, React Navigation, EventsCalendarView.
 *
 * Pomysł (alt): react-native-maps / Mapbox; Expo Router search params;
 * Flutter ListView + google_maps_flutter.
 */
import { useCallback, useMemo, useState } from "react";
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
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api/client";
import type { ApiEvent, Car, EventMarker, EventMarkersResponse, PaginatedEvents } from "../api/types";
import { DEFAULT_IMAGE, EVENT_CATEGORY_GROUPS } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { ScreenHeader, GhostButton } from "../components/ui";
import { EventsCalendarView } from "../components/EventsCalendarView";
import { colors } from "../theme/colors";
import { VOIVODESHIPS, TRACK_PRESETS, FILTER_CITIES } from "../lib/locationPresets";
import type { EventsStackParamList, RootStackParamList } from "../navigation/types";

type ViewMode = "list" | "calendar" | "map";
type PaidFilter = "all" | "true" | "false";

/** Buduje query string filtrów zgodny z backendem Spring. */
function buildParams(opts: {
  q: string;
  paid: PaidFilter;
  category: string;
  voivodeship: string;
  city: string;
  track: string;
  dateFrom: string;
  dateTo: string;
  carId: string;
}): URLSearchParams {
  const params = new URLSearchParams();
  if (opts.q.trim()) params.set("q", opts.q.trim());
  if (opts.paid !== "all") params.set("paid", opts.paid);
  if (opts.category) params.set("category", opts.category);
  if (opts.voivodeship) params.set("voivodeship", opts.voivodeship);
  if (opts.city.trim()) params.set("city", opts.city.trim());
  if (opts.track) params.set("track", opts.track);
  if (opts.dateFrom.trim()) params.set("dateFrom", opts.dateFrom.trim());
  if (opts.dateTo.trim()) params.set("dateTo", opts.dateTo.trim());
  if (opts.carId) params.set("carId", opts.carId);
  return params;
}

function openMaps(lat: number, lng: number, label: string) {
  const q = encodeURIComponent(label);
  const url =
    Platform.OS === "ios"
      ? `http://maps.apple.com/?ll=${lat},${lng}&q=${q}`
      : `geo:${lat},${lng}?q=${lat},${lng}(${q})`;
  void Linking.openURL(url);
}

export function EventsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EventsStackParamList>>();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout } = useAuth();

  const [view, setView] = useState<ViewMode>("list");
  const [items, setItems] = useState<ApiEvent[]>([]);
  const [overview, setOverview] = useState<EventMarker[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moreFilters, setMoreFilters] = useState(false);

  const [q, setQ] = useState("");
  const [paid, setPaid] = useState<PaidFilter>("all");
  const [category, setCategory] = useState("");
  const [voivodeship, setVoivodeship] = useState("");
  const [city, setCity] = useState("");
  const [track, setTrack] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [carId, setCarId] = useState("");

  const filterKey = { q, paid, category, voivodeship, city, track, dateFrom, dateTo, carId };

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      setError(null);
      try {
        const params = buildParams(filterKey);
        if (view === "list") {
          params.set("limit", "40");
          params.set("page", "1");
          const res = await api.get<PaginatedEvents>(`/api/events?${params}`);
          setItems(res.items);
          setOverview([]);
        } else {
          const res = await api.get<EventMarkersResponse>(`/api/events/markers?${params}`);
          setOverview(res.items);
          setItems([]);
        }
      } catch {
        setError("Nie udało się pobrać wydarzeń. Czy API działa?");
        setItems([]);
        setOverview([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional filterKey fields
    [q, paid, category, voivodeship, city, track, dateFrom, dateTo, carId, view],
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
      if (user) {
        api.get<Car[]>("/api/garage").then(setCars).catch(() => setCars([]));
      } else {
        setCars([]);
        setCarId("");
      }
    }, [load, user]),
  );

  const mapMarkers = useMemo(
    () => overview.filter((e) => e.lat != null && e.lng != null),
    [overview],
  );

  const categories = useMemo(
    () => EVENT_CATEGORY_GROUPS.flatMap((g) => g.items).filter((c) => c !== "Inne"),
    [],
  );

  const goDetail = (id: string) => navigation.navigate("EventDetail", { id });

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="WYDARZENIA"
        subtitle={user?.username ?? "Gość"}
        right={
          user ? (
            <GhostButton label="Wyloguj" onPress={logout} />
          ) : (
            <GhostButton label="Zaloguj" onPress={() => rootNav.navigate("Login")} />
          )
        }
      />

      <View style={styles.viewTabs}>
        {(
          [
            ["list", "Lista"],
            ["calendar", "Kalendarz"],
            ["map", "Mapa"],
          ] as const
        ).map(([id, label]) => (
          <Pressable
            key={id}
            style={[styles.viewTab, view === id && styles.viewTabOn]}
            onPress={() => setView(id)}
          >
            <Text style={[styles.viewTabText, view === id && styles.viewTabTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Pressable
            style={[styles.chip, !category && styles.chipOn]}
            onPress={() => setCategory("")}
          >
            <Text style={[styles.chipText, !category && styles.chipTextOn]}>Kat. wszystkie</Text>
          </Pressable>
          {categories.map((c) => (
            <Pressable
              key={c}
              style={[styles.chip, category === c && styles.chipOn]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.chipText, category === c && styles.chipTextOn]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <GhostButton
          label={moreFilters ? "Mniej filtrów" : "Więcej filtrów"}
          onPress={() => setMoreFilters((v) => !v)}
        />

        {moreFilters ? (
          <View style={styles.moreBox}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Pressable
                style={[styles.chip, !voivodeship && styles.chipOn]}
                onPress={() => setVoivodeship("")}
              >
                <Text style={[styles.chipText, !voivodeship && styles.chipTextOn]}>Woj. wszystkie</Text>
              </Pressable>
              {VOIVODESHIPS.map((v) => (
                <Pressable
                  key={v}
                  style={[styles.chip, voivodeship === v && styles.chipOn]}
                  onPress={() => setVoivodeship(v)}
                >
                  <Text style={[styles.chipText, voivodeship === v && styles.chipTextOn]}>{v}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Pressable style={[styles.chip, !city && styles.chipOn]} onPress={() => setCity("")}>
                <Text style={[styles.chipText, !city && styles.chipTextOn]}>Miasto wszystkie</Text>
              </Pressable>
              {FILTER_CITIES.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.chip, city === c && styles.chipOn]}
                  onPress={() => setCity(c)}
                >
                  <Text style={[styles.chipText, city === c && styles.chipTextOn]}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Pressable style={[styles.chip, !track && styles.chipOn]} onPress={() => setTrack("")}>
                <Text style={[styles.chipText, !track && styles.chipTextOn]}>Tor wszystkie</Text>
              </Pressable>
              {TRACK_PRESETS.map((t) => (
                <Pressable
                  key={t.track}
                  style={[styles.chip, track === t.track && styles.chipOn]}
                  onPress={() => setTrack(t.track)}
                >
                  <Text style={[styles.chipText, track === t.track && styles.chipTextOn]}>{t.track}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.dateRow}>
              <TextInput
                style={[styles.search, styles.dateInput]}
                placeholder="Od (YYYY-MM-DD)"
                placeholderTextColor={colors.muted}
                value={dateFrom}
                onChangeText={setDateFrom}
              />
              <TextInput
                style={[styles.search, styles.dateInput]}
                placeholder="Do (YYYY-MM-DD)"
                placeholderTextColor={colors.muted}
                value={dateTo}
                onChangeText={setDateTo}
              />
            </View>
            {user ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                <Pressable style={[styles.chip, !carId && styles.chipOn]} onPress={() => setCarId("")}>
                  <Text style={[styles.chipText, !carId && styles.chipTextOn]}>Bez filtra garażu</Text>
                </Pressable>
                {cars.map((car) => (
                  <Pressable
                    key={car.id}
                    style={[styles.chip, carId === car.id && styles.chipOn]}
                    onPress={() => setCarId(car.id)}
                  >
                    <Text style={[styles.chipText, carId === car.id && styles.chipTextOn]}>
                      {car.make} {car.model}
                      {car.className ? ` · ${car.className}` : ""}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
          </View>
        ) : null}

        <GhostButton label="Zastosuj filtry" onPress={() => load()} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : view === "calendar" ? (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.gold} />
          }
        >
          <EventsCalendarView events={overview} onSelectEvent={goDetail} />
        </ScrollView>
      ) : view === "map" ? (
        <FlatList
          data={mapMarkers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.gold} />
          }
          ListHeaderComponent={
            <Text style={styles.mapHint}>
              Mapa lokalizacji — otwórz w aplikacji map (Leaflet WebView opcjonalnie później).
            </Text>
          }
          ListEmptyComponent={<Text style={styles.empty}>Brak wydarzeń z GPS dla filtrów.</Text>}
          renderItem={({ item }) => (
            <View style={styles.mapCard}>
              <Pressable onPress={() => goDetail(item.id)}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.meta}>
                  {item.track}, {item.city} · {item.dateLabel || item.date.slice(0, 10)}
                </Text>
              </Pressable>
              <GhostButton
                label="Otwórz w mapach"
                onPress={() => openMaps(item.lat!, item.lng!, `${item.track}, ${item.city}`)}
              />
            </View>
          )}
        />
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
            <Pressable style={styles.card} onPress={() => goDetail(item.id)}>
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
  viewTabs: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingTop: 8 },
  viewTab: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  viewTabOn: { borderColor: colors.gold, backgroundColor: "#2a2500" },
  viewTabText: { color: colors.muted, fontWeight: "800", fontSize: 12 },
  viewTabTextOn: { color: colors.gold },
  filters: { padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  moreBox: { gap: 8 },
  search: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateRow: { flexDirection: "row", gap: 8 },
  dateInput: { flex: 1 },
  chips: { flexDirection: "row", gap: 8, alignItems: "center", paddingVertical: 2 },
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
  mapCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
    marginBottom: 10,
  },
  mapHint: { color: colors.muted, fontSize: 12, marginBottom: 8 },
  image: { width: "100%", height: 140 },
  cardBody: { padding: 14, gap: 4 },
  category: { color: colors.gold, fontWeight: "800", fontSize: 12 },
  name: { color: colors.text, fontWeight: "800", fontSize: 16 },
  meta: { color: colors.muted, fontSize: 13 },
  error: { color: colors.danger, textAlign: "center", marginTop: 40, paddingHorizontal: 24 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
});
