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
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api, ApiError } from "../api/client";
import type { ApiEvent } from "../api/types";
import { DEFAULT_IMAGE } from "../api/types";
import { colors } from "../theme/colors";
import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "EventDetail">;

export function EventDetailScreen({ route }: Props) {
  const { id } = route.params;
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    api
      .get<ApiEvent>(`/api/events/${id}`)
      .then(setEvent)
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [id]);

  const register = async () => {
    if (!event) return;
    setRegistering(true);
    try {
      await api.post("/api/registrations", { eventId: event.id });
      Alert.alert("OK", "Zgłoszenie wysłane");
    } catch (e) {
      Alert.alert("Błąd", e instanceof ApiError ? e.message : "Nie udało się zgłosić");
    } finally {
      setRegistering(false);
    }
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
        <Text style={styles.desc}>{event.description}</Text>
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
  btn: {
    marginTop: 24,
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnText: { color: "#121212", fontWeight: "900", letterSpacing: 1 },
});
