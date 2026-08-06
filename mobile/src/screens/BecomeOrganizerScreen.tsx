/**
 * Wniosek „Zostań organizatorem” (`POST /api/organizer/apply`).
 *
 * Rola w architekturze: dla roli USER (RequireAuth w App); ORGANIZER/ADMIN
 * widzą komunikat że już mają uprawnienia. Admin rozpatruje w AdminScreen.
 *
 * Pomysł (alt): upload dokumentów firmy; weryfikacja NIP.
 */
import { useState } from "react";
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { api, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Field, PrimaryButton, EmptyState, ErrorText } from "../components/ui";
import { colors } from "../theme/colors";

export function BecomeOrganizerScreen() {
  const { user } = useAuth();
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!user) {
    return (
      <View style={styles.root}>
        <EmptyState text="Zaloguj się, żeby złożyć wniosek organizatora." />
      </View>
    );
  }

  if (user.role === "ORGANIZER" || user.role === "ADMIN") {
    return (
      <View style={styles.root}>
        <EmptyState text="Masz już uprawnienia organizatora." />
      </View>
    );
  }

  const submit = async () => {
    if (!company.trim() || !message.trim()) {
      setError("Uzupełnij firmę i wiadomość");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/organizer/apply", { company: company.trim(), message: message.trim() });
      setDone(true);
      Alert.alert("OK", "Wniosek wysłany");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Błąd");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>Zostań organizatorem</Text>
        {done ? (
          <Text style={styles.ok}>Wniosek został wysłany. Admin go rozpatrzy.</Text>
        ) : (
          <>
            <Field label="Firma / nazwa" value={company} onChangeText={setCompany} />
            <Field label="Wiadomość" multiline value={message} onChangeText={setMessage} />
            {error ? <ErrorText text={error} /> : null}
            <PrimaryButton label="WYŚLIJ WNIOSEK" onPress={submit} busy={busy} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 22, fontWeight: "900", marginBottom: 16 },
  ok: { color: colors.text, lineHeight: 22 },
});
