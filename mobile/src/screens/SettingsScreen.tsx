import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { ToggleRow, PrimaryButton } from "../components/ui";
import { colors } from "../theme/colors";

const KEY = "raceportal_settings";

type Settings = {
  emailAlerts: boolean;
  startReminders: boolean;
  soundFx: boolean;
  pitStopMode: boolean;
  accent: "gold" | "redline" | "ice";
  teamFlair: string;
};

const defaults: Settings = {
  emailAlerts: true,
  startReminders: true,
  soundFx: false,
  pitStopMode: false,
  accent: "gold",
  teamFlair: "",
};

async function loadSettings(): Promise<Settings> {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
    }
    const raw = await SecureStore.getItemAsync(KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

async function saveSettings(s: Settings) {
  const raw = JSON.stringify(s);
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    localStorage.setItem(KEY, raw);
    return;
  }
  await SecureStore.setItemAsync(KEY, raw);
}

export function SettingsScreen() {
  const [s, setS] = useState<Settings>(defaults);

  useEffect(() => {
    loadSettings().then(setS);
  }, []);

  const save = async () => {
    await saveSettings(s);
    Alert.alert("OK", "Ustawienia zapisane lokalnie");
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Ustawienia</Text>
      <ToggleRow label="Alerty e-mail" value={s.emailAlerts} onChange={(emailAlerts) => setS((x) => ({ ...x, emailAlerts }))} />
      <ToggleRow label="Przypomnienia startu" value={s.startReminders} onChange={(startReminders) => setS((x) => ({ ...x, startReminders }))} />
      <ToggleRow label="Dźwięki" value={s.soundFx} onChange={(soundFx) => setS((x) => ({ ...x, soundFx }))} />
      <ToggleRow label="Tryb pit-stop" value={s.pitStopMode} onChange={(pitStopMode) => setS((x) => ({ ...x, pitStopMode }))} />
      <Text style={styles.label}>Akcent</Text>
      <View style={styles.row}>
        {(["gold", "redline", "ice"] as const).map((accent) => (
          <Pressable
            key={accent}
            style={[styles.chip, s.accent === accent && styles.chipOn]}
            onPress={() => setS((x) => ({ ...x, accent }))}
          >
            <Text style={styles.chipText}>{accent}</Text>
          </Pressable>
        ))}
      </View>
      <PrimaryButton label="ZAPISZ" onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 22, fontWeight: "900", marginBottom: 12 },
  label: { color: colors.muted, marginTop: 16, marginBottom: 8, fontWeight: "700" },
  row: { flexDirection: "row", gap: 8, marginBottom: 16 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: { borderColor: colors.gold },
  chipText: { color: colors.text, fontWeight: "700" },
});
