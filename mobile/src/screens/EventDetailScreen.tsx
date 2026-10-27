/**
 * Szczegóły wydarzenia (publiczne) — CTA zapisuje na webie.
 *
 * Mobilka-wizytówka: bez logowania / garażu / POST registrations.
 * `Linking` → EXPO_PUBLIC_WEB_URL/wydarzenia/:id
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
  Linking,
  Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api, eventMediaUrl, webEventUrl } from "../api/client";
import type { ApiEvent } from "../api/types";
import { useTheme } from "../theme/ThemeContext";
import { useLocale } from "../i18n/LocaleContext";
import { colors } from "../theme/colors";
import type { EventsStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<EventsStackParamList, "EventDetail">;

export function EventDetailScreen({ route }: Props) {
  const { id } = route.params;
  const { accentColor } = useTheme();
  const { t } = useLocale();
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ApiEvent>(`/api/events/${id}`)
      .then(setEvent)
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [id]);

  const openWebRegister = async () => {
    const url = webEventUrl(id);
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(t("mobile.openWebFail"), url);
    }
  };

  const openMaps = () => {
    if (!event?.lat || !event?.lng) return;
    const q = encodeURIComponent(`${event.track}, ${event.city} ${event.lat},${event.lng}`);
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={accentColor} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{t("mobile.notFound")}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 40 }}>
      <Image source={{ uri: eventMediaUrl(event) }} style={styles.image} />
      <View style={styles.body}>
        <Text style={[styles.category, { color: accentColor }]}>{event.category}</Text>
        <Text style={styles.name}>{event.name}</Text>
        <Text style={styles.meta}>
          {event.dateLabel || event.date.slice(0, 10)} · {event.time}
        </Text>
        <Text style={styles.meta}>
          {event.track}, {event.city}
        </Text>
        {event.paid ? (
          <Text style={styles.meta}>
            {t("mobile.paidLabel")}: {event.entryFee != null ? `${event.entryFee} PLN` : t("common.paid")}
          </Text>
        ) : (
          <Text style={styles.meta}>{t("mobile.freeEntry")}</Text>
        )}
        <Text style={styles.desc}>{event.description}</Text>

        {event.lat && event.lng ? (
          <Pressable style={[styles.mapBtn, { borderColor: accentColor }]} onPress={openMaps}>
            <Text style={[styles.mapBtnText, { color: accentColor }]}>{t("mobile.openMaps")}</Text>
          </Pressable>
        ) : null}

        <Text style={styles.ctaHint}>{t("mobile.registerHint")}</Text>
        <Pressable style={[styles.btn, { backgroundColor: accentColor }]} onPress={openWebRegister}>
          <Text style={styles.btnText}>{t("mobile.registerOnWeb")}</Text>
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
  category: { fontWeight: "800" },
  name: { color: colors.text, fontSize: 24, fontWeight: "900" },
  meta: { color: colors.muted, fontSize: 14 },
  desc: { color: colors.muted, marginTop: 12, lineHeight: 22 },
  muted: { color: colors.muted },
  mapBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  mapBtnText: { fontWeight: "700" },
  ctaHint: { color: colors.muted, marginTop: 16, fontSize: 13, lineHeight: 18 },
  btn: {
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnText: { color: "#121212", fontWeight: "900", letterSpacing: 1 },
});
