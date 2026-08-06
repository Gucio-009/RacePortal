/**
 * Profil użytkownika — edycja `/api/auth/me` + zmiana hasła.
 *
 * Rola w architekturze: ekran za RequireAuth (Gate w App); awatary z presetów
 * lub inicjały. Aktualizuje AuthContext przez `setUser` / `refreshMe`.
 *
 * Pomysł (alt): upload własnego awatara; 2FA.
 */
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
} from "react-native";
import { api, ApiError } from "../api/client";
import type { User } from "../api/types";
import { AVATAR_PRESETS, userInitials } from "../api/types";
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

  const initials = userInitials({ username, firstName, lastName });
  const isInitials = !avatar.trim();

  const saveProfile = async () => {
    setBusy(true);
    setError(null);
    try {
      const updated = await api.patch<User>("/api/auth/me", {
        username: username.trim(),
        avatar: avatar.trim(),
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
        <Text style={styles.meta}>
          {user.email} · {user.role}
        </Text>
        <Field label="Nazwa użytkownika" value={username} onChangeText={setUsername} />
        <Field label="Imię" value={firstName} onChangeText={setFirstName} />
        <Field label="Nazwisko" value={lastName} onChangeText={setLastName} />
        <Field label="Telefon" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <Text style={styles.label}>Awatar</Text>
        <Text style={styles.hint}>Domyślnie inicjały — wybierz gotowy styl albo wróć do inicjałów.</Text>
        <View style={styles.avatarRow}>
          <Pressable
            onPress={() => setAvatar("")}
            style={[styles.avatarBtn, isInitials && styles.avatarBtnOn]}
          >
            <View style={styles.initialsCircle}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
          </Pressable>
          {AVATAR_PRESETS.map((preset) => {
            const on = avatar === preset.url;
            return (
              <Pressable
                key={preset.id}
                onPress={() => setAvatar(preset.url)}
                style={[styles.avatarBtn, on && styles.avatarBtnOn]}
              >
                <Image source={{ uri: preset.url }} style={styles.avatarImg} />
              </Pressable>
            );
          })}
        </View>

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
  label: { color: colors.text, fontWeight: "700", marginBottom: 4, marginTop: 8 },
  hint: { color: colors.muted, fontSize: 12, marginBottom: 10 },
  avatarRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  avatarBtn: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 999,
    padding: 2,
  },
  avatarBtnOn: { borderColor: colors.gold },
  avatarImg: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.card },
  initialsCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: { color: colors.bg, fontWeight: "900", fontSize: 18 },
});
