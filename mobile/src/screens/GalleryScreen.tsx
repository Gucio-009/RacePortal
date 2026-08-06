/**
 * Placeholder galerii (świadomie odłożony — parity z webem).
 *
 * Rola w architekturze: ekran w More stack; brak uploadu w MVP mobile.
 *
 * Pomysł (alt): expo-image-picker + CDN; albumy per event; Flutter photo_manager.
 */
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export function GalleryScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Galeria</Text>
      <Text style={styles.body}>
        Galeria jest świadomie odłożona (tak jak na webie). Wraca w kolejnym etapie — upload i albumy eventów.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: "center" },
  title: { color: colors.text, fontSize: 24, fontWeight: "900", marginBottom: 12 },
  body: { color: colors.muted, lineHeight: 22 },
});
