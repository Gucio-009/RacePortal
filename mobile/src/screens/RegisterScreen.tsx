/**
 * Rejestracja konta + opcjonalna weryfikacja e-mail (kod).
 *
 * Rola w architekturze: dwuetapowy flow form → verify (gdy API wymaga),
 * te same reguły hasła co backend. Po verify token trafia do magazynu jak przy loginie.
 *
 * Pomysł (alt): magic link zamiast kodu; Sign in with Apple / Google.
 */
import { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { Field, PrimaryButton, ErrorText, ToggleRow } from "../components/ui";
import { colors } from "../theme/colors";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { register, verifyEmail, resendCode } = useAuth();
  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasLicense, setHasLicense] = useState(false);
  const [pzm, setPzm] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onRegister = async () => {
    setError(null);
    if (password !== confirm) {
      setError("Hasła muszą być takie same");
      return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError("Hasło: min. 8 znaków, wielka litera, cyfra i znak specjalny");
      return;
    }
    setBusy(true);
    const res = await register({
      email: email.trim(),
      username: username.trim(),
      password,
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
      hasDrivingLicenseB: hasLicense,
      pzmLicense: hasLicense ? pzm.trim() || undefined : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.message || "Błąd rejestracji");
      return;
    }
    if (res.requiresVerification) {
      setStep("verify");
      return;
    }
  };

  const onVerify = async () => {
    setBusy(true);
    setError(null);
    const res = await verifyEmail(email.trim(), code.trim());
    setBusy(false);
    if (!res.ok) setError(res.message || "Błędny kod");
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Rejestracja</Text>
        {step === "form" ? (
          <View style={styles.card}>
            <Field label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <Field label="Nazwa użytkownika" autoCapitalize="none" value={username} onChangeText={setUsername} />
            <Field label="Hasło" secureTextEntry value={password} onChangeText={setPassword} />
            <Field label="Powtórz hasło" secureTextEntry value={confirm} onChangeText={setConfirm} />
            <Field label="Imię" value={firstName} onChangeText={setFirstName} />
            <Field label="Nazwisko" value={lastName} onChangeText={setLastName} />
            <Field label="Telefon" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <ToggleRow label="Prawo jazdy kat. B" value={hasLicense} onChange={setHasLicense} />
            {hasLicense ? <Field label="Licencja PZM (opcjonalnie)" value={pzm} onChangeText={setPzm} /> : null}
            {error ? <ErrorText text={error} /> : null}
            <PrimaryButton label="ZAŁÓŻ KONTO" onPress={onRegister} busy={busy} />
            <Pressable onPress={() => navigation.navigate("Login")}>
              <Text style={styles.link}>Mam już konto</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.hint}>Wpisz kod z e-maila ({email})</Text>
            <Field label="Kod weryfikacyjny" value={code} onChangeText={setCode} keyboardType="number-pad" />
            {error ? <ErrorText text={error} /> : null}
            <PrimaryButton label="POTWIERDŹ" onPress={onVerify} busy={busy} />
            <PrimaryButton
              label="Wyślij kod ponownie"
              onPress={async () => {
                setBusy(true);
                const r = await resendCode(email.trim());
                setBusy(false);
                if (!r.ok) setError(r.message || "Błąd");
              }}
              busy={busy}
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.gold }}
            />
          </View>
        )}
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
  hint: { color: colors.muted, marginBottom: 8 },
});
