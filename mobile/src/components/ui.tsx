/**
 * Wspólne komponenty UI (nagłówek, pola, przyciski, toggle, stany puste/błąd).
 *
 * Rola w architekturze: cienka warstwa prezentacji React Native —
 * StyleSheet + Pressable zamiast HTML; reużywane na ekranach auth, garażu, admina.
 *
 * Technologie: React Native primitives (View, Text, TextInput, Switch).
 *
 * Pomysł (alt): NativeWind / Tamagui / React Native Paper;
 * Flutter Material/Cupertino widgets; design system z Figma Code Connect.
 */
import type { ReactNode } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Switch,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/colors";

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top + 12, 20) }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>
          {title} <Text style={styles.gold}>•</Text>
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6, marginBottom: 10 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, props.multiline ? { minHeight: 88, textAlignVertical: "top" } : null]}
        {...props}
      />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  busy,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      style={[styles.btn, (disabled || busy) && { opacity: 0.6 }, style]}
      onPress={onPress}
      disabled={disabled || busy}
    >
      {busy ? <ActivityIndicator color="#121212" /> : <Text style={styles.btnText}>{label}</Text>}
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={[styles.ghost, danger && { borderColor: colors.danger }]}
      onPress={onPress}
    >
      <Text style={[styles.ghostText, danger && { color: colors.danger }]}>{label}</Text>
    </Pressable>
  );
}

export function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#333", true: colors.gold }}
        thumbColor="#fff"
      />
    </View>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

export function ErrorText({ text }: { text: string }) {
  return <Text style={styles.error}>{text}</Text>;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    gap: 12,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "900", letterSpacing: 1 },
  gold: { color: colors.gold },
  subtitle: { color: colors.muted, marginTop: 2, fontSize: 13 },
  label: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  input: {
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  btn: {
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#121212", fontWeight: "800", letterSpacing: 1 },
  ghost: {
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  ghostText: { color: colors.gold, fontWeight: "700", fontSize: 12 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleLabel: { color: colors.text, flex: 1, paddingRight: 12 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40, paddingHorizontal: 24 },
  error: { color: colors.danger, fontSize: 13, marginVertical: 6 },
});
