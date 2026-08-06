/**
 * Ekran logowania (modal Root stack).
 *
 * Rola w architekturze: zbiera email/hasło → AuthContext.login → JWT w SecureStore/localStorage.
 * Po sukcesie wraca (`goBack`) lub nawiguje do Main. Linki do Register / ForgotPassword.
 *
 * Technologie: KeyboardAvoidingView (iOS padding), React Navigation modals.
 *
 * Pomysł (alt): biometria + refresh token; OAuth Google jak na webie;
 * Flutter Form + `flutter_secure_storage`.
 */
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import type { RootStackParamList } from "../navigation/types";

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    const res = await login(email.trim(), password);
    if (!res.ok) {
      setError(res.message || "Nie udało się zalogować");
      setBusy(false);
      return;
    }
    setBusy(false);
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("Main");
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>
          RACE<Text style={styles.gold}>PORTAL</Text>
        </Text>
        <Text style={styles.sub}>Uproszczona wersja mobilna</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor={colors.muted}
            placeholder="email@example.com"
          />
          <Text style={styles.label}>Hasło</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor={colors.muted}
            placeholder="••••••••"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.btn} onPress={onSubmit} disabled={busy}>
            {busy ? <ActivityIndicator color="#121212" /> : <Text style={styles.btnText}>ZALOGUJ</Text>}
          </Pressable>
          <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.link}>Nie pamiętam hasła</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Register")}>
            <Text style={styles.link}>Załóż konto</Text>
          </Pressable>
          {__DEV__ ? <Text style={styles.hint}>DEV demo: test@wp.pl / test123</Text> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  brand: {
    color: colors.text,
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
  },
  gold: { color: colors.gold },
  sub: { color: colors.muted, textAlign: "center", marginBottom: 32, marginTop: 8 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 10,
  },
  label: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  input: {
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  btn: {
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#121212", fontWeight: "800", letterSpacing: 1 },
  error: { color: colors.danger, fontSize: 13 },
  hint: { color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 8 },
  link: { color: colors.gold, textAlign: "center", fontWeight: "600", marginTop: 4 },
});
