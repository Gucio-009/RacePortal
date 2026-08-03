import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { api, ApiError } from "../api/client";
import type { User } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { Field, PrimaryButton, ToggleRow, ErrorText } from "../components/ui";
import { colors } from "../theme/colors";

export function AccountScreen() {
  const { user, setUser, refreshMe } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [hasLicense, setHasLicense] = useState(Boolean(user?.hasDrivingLicenseB));
  const [pzm, setPzm] = useState(user?.pzmLicense || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <View style={styles.root}>
        <Text style={styles.muted}>Zaloguj się</Text>
      </View>
    );
  }

  const saveProfile = async () => {
    setBusy(true);
    setError(null);
    try {
      const updated = await api.patch<User>("/api/auth/me", {
        username: username.trim(),
        avatar: avatar.trim() || null,
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        phone: phone.trim() || null,
        hasDrivingLicenseB: hasLicense,
        pzmLicense: hasLicense ? pzm.trim() || null : null,
      });
      setUser(updated);
      Alert.alert("OK", "Profil zapisany");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Błąd");
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) {
      setError("Nowe hasło min. 6 znaków");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/auth/me/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      await refreshMe();
      Alert.alert("OK", "Hasło zmienione");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Błąd zmiany hasła");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Text style={styles.title}>Konto</Text>
        <Text style={styles.meta}>{user.email} · {user.role}</Text>
        <Field label="Nazwa użytkownika" value={username} onChangeText={setUsername} />
        <Field label="Imię" value={firstName} onChangeText={setFirstName} />
        <Field label="Nazwisko" value={lastName} onChangeText={setLastName} />
        <Field label="Telefon" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Avatar URL" value={avatar} onChangeText={setAvatar} autoCapitalize="none" />
        <ToggleRow label="Prawo jazdy B" value={hasLicense} onChange={setHasLicense} />
        {hasLicense ? <Field label="Licencja PZM" value={pzm} onChangeText={setPzm} /> : null}
        {error ? <ErrorText text={error} /> : null}
        <PrimaryButton label="ZAPISZ PROFIL" onPress={saveProfile} busy={busy} />

        <Text style={[styles.title, { marginTop: 28 }]}>Hasło</Text>
        <Field label="Obecne hasło" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
        <Field label="Nowe hasło" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
        <PrimaryButton label="ZMIEŃ HASŁO" onPress={changePassword} busy={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 22, fontWeight: "900", marginBottom: 8 },
  meta: { color: colors.muted, marginBottom: 16 },
  muted: { color: colors.muted, textAlign: "center", marginTop: 40 },
});
