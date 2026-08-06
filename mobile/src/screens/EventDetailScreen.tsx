/**
 * Szczegóły wydarzenia + zapis na start (`POST /api/registrations`).
 *
 * Rola w architekturze: wspólny ekran w Events stack i More stack (param `id`).
 * Dobór auta z garażu przez `partitionCarsForEvent`; mapy przez Linking.
 * Wymaga logowania do zapisu (Alert jeśli gość).
 *
 * Pomysł (alt): płatności in-app (Stripe); share sheet; push przypomnienia startu.
 */
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
  Linking,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api, ApiError } from "../api/client";
import type { ApiEvent, Car } from "../api/types";
import { DEFAULT_IMAGE } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { partitionCarsForEvent } from "../lib/carMatch";
import { colors } from "../theme/colors";
import type { EventsStackParamList, MoreStackParamList } from "../navigation/types";

type Props =
  | NativeStackScreenProps<EventsStackParamList, "EventDetail">
  | NativeStackScreenProps<MoreStackParamList, "EventDetail">;

export function EventDetailScreen({ route }: Props) {
  const { id } = route.params;
  const { user } = useAuth();
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [carId, setCarId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<ApiEvent>(`/api/events/${id}`),
      user ? api.get<Car[]>("/api/garage").catch(() => [] as Car[]) : Promise.resolve([] as Car[]),
    ])
      .then(([ev, garage]) => {
        setEvent(ev);
        setCars(garage);
        const { recommended, other } = partitionCarsForEvent(garage, ev.category);
        setCarId(recommended[0]?.id ?? other[0]?.id ?? null);
      })
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [id, user]);

  const register = async () => {
    if (!event) return;
    if (!user) {
      Alert.alert("Logowanie", "Zaloguj się, żeby zapisać się na wydarzenie.");
      return;
    }
    setRegistering(true);
    try {
      await api.post("/api/registrations", {
        eventId: event.id,
        carId: carId || undefined,
      });
      Alert.alert("OK", "Zgłoszenie wysłane");
    } catch (e) {
      Alert.alert("Błąd", e instanceof ApiError ? e.message : "Nie udało się zgłosić");
    } finally {
      setRegistering(false);
    }
  };

  const openMaps = () => {
    if (!event?.lat || !event?.lng) return;
    Linking.openURL(`http://maps.apple.com/?ll=${event.lat},${event.lng}&q=${encodeURIComponent(event.track)}`);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Nie znaleziono wydarzenia</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 40 }}>
      <Image source={{ uri: event.imageUrl || DEFAULT_IMAGE }} style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.category}>{event.category}</Text>
        <Text style={styles.name}>{event.name}</Text>
        <Text style={styles.meta}>
          {event.dateLabel || event.date.slice(0, 10)} · {event.time}
        </Text>
        <Text style={styles.meta}>
          {event.track}, {event.city}
        </Text>
        {event.paid ? (
          <Text style={styles.meta}>
            Wpisowe: {event.entryFee != null ? `${event.entryFee} PLN` : "płatne"}
          </Text>
        ) : (
          <Text style={styles.meta}>Wstęp / start darmowy</Text>
        )}
        <Text style={styles.desc}>{event.description}</Text>

        {cars.length > 0 && event ? (
          <View style={{ marginTop: 16, gap: 8 }}>
            <Text style={styles.section}>Auto z garażu</Text>
            {(() => {
              const { recommended, other } = partitionCarsForEvent(cars, event.category);
              return (
                <>
                  {recommended.length > 0 ? (
                    <Text style={styles.meta}>Pasujące do kategorii</Text>
                  ) : null}
                  {recommended.map((car) => (
                    <Pressable
                      key={car.id}
                      style={[styles.carChip, carId === car.id && styles.carChipOn]}
                      onPress={() => setCarId(car.id)}
                    >
                      <Text style={styles.carText}>
                        ★ {car.make} {car.model}
                        {car.className ? ` · ${car.className}` : ""}
                      </Text>
                    </Pressable>
                  ))}
                  {other.length > 0 ? <Text style={styles.meta}>Pozostałe</Text> : null}
                  {other.map((car) => (
                    <Pressable
                      key={car.id}
                      style={[styles.carChip, carId === car.id && styles.carChipOn]}
                      onPress={() => setCarId(car.id)}
                    >
                      <Text style={styles.carText}>
                        {car.make} {car.model}
                        {car.className ? ` · ${car.className}` : ""}
                      </Text>
                    </Pressable>
                  ))}
                </>
              );
            })()}
          </View>
        ) : null}

        {event.lat && event.lng ? (
          <Pressable style={styles.mapBtn} onPress={openMaps}>
            <Text style={styles.mapBtnText}>Otwórz w Mapach</Text>
          </Pressable>
        ) : null}

        <Pressable style={styles.btn} onPress={register} disabled={registering}>
          {registering ? (
            <ActivityIndicator color="#121212" />
          ) : (
            <Text style={styles.btnText}>ZAPISZ SIĘ</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" },
  image: { width: "100%", height: 220 },
  body: { padding: 20, gap: 8 },
  category: { color: colors.gold, fontWeight: "800" },
  name: { color: colors.text, fontSize: 24, fontWeight: "900" },
  meta: { color: colors.muted, fontSize: 14 },
  desc: { color: colors.muted, marginTop: 12, lineHeight: 22 },
  muted: { color: colors.muted },
  section: { color: colors.text, fontWeight: "800" },
  carChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
  },
  carChipOn: { borderColor: colors.gold },
  carText: { color: colors.text },
  mapBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  mapBtnText: { color: colors.gold, fontWeight: "700" },
  btn: {
    marginTop: 16,
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnText: { color: "#121212", fontWeight: "900", letterSpacing: 1 },
});
