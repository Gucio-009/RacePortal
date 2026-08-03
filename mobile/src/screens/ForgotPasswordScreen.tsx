import { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api, ApiError } from "../api/client";
import { Field, PrimaryButton, ErrorText } from "../components/ui";
import { colors } from "../theme/colors";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ message?: string }>("/api/auth/forgot-password", { email: email.trim() });
      setMessage(res.message || "Jeśli konto istnieje, wysłaliśmy instrukcję resetu.");
      setDone(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Błąd");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Reset hasła</Text>
        <View style={styles.card}>
          {done ? (
            <>
              <Text style={styles.ok}>{message}</Text>
              <PrimaryButton label="WRÓĆ DO LOGOWANIA" onPress={() => navigation.navigate("Login")} />
            </>
          ) : (
            <>
              <Field
                label="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              {error ? <ErrorText text={error} /> : null}
              <PrimaryButton label="WYŚLIJ" onPress={onSubmit} busy={busy} />
              <Pressable onPress={() => navigation.navigate("Login")}>
                <Text style={styles.link}>Anuluj</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, paddingTop: 64 },
  title: { color: colors.text, fontSize: 28, fontWeight: "900", marginBottom: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  link: { color: colors.gold, textAlign: "center", marginTop: 12, fontWeight: "600" },
  ok: { color: colors.text, marginBottom: 12, lineHeight: 22 },
});
