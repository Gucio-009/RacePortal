/**
 * Brama RBAC dla ekranów chronionych (odpowiednik web AuthGate).
 *
 * Rola w architekturze: role gate — wymaga zalogowanego użytkownika,
 * opcjonalnie sprawdza `roles` (np. ADMIN, ORGANIZER). Bez sesji → nawigacja
 * do modala Login; złą rolą → reset do Main + komunikat „Brak uprawnień”.
 * Używane w `App.tsx` przez wrapper `Gate` wokół Dashboard/Garaż/Konto/Admin/Org.
 *
 * Technologie: React Navigation (`navigate` / `CommonActions.reset`), AuthContext.
 *
 * Pomysł (alt): Expo Router `Stack.Protected` / layout guards;
 * Flutter `GoRouter` redirect; osobny stack auth bez zagnieżdżania Gate.
 */
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, View, StyleSheet, Text, Pressable } from "react-native";
import { CommonActions, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../api/types";
import type { RootStackParamList } from "./types";
import { colors } from "../theme/colors";

/** Odpowiednik web AuthGate: wymaga logowania i opcjonalnie ról. */
export function RequireAuth({
  roles,
  children,
}: {
  roles?: UserRole[];
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [prompted, setPrompted] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user && !prompted) {
      setPrompted(true);
      navigation.navigate("Login");
      return;
    }
    if (user && roles && !roles.includes(user.role)) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Main" }],
        }),
      );
    }
  }, [user, loading, roles, navigation, prompted]);

  useEffect(() => {
    if (user) setPrompted(false);
  }, [user]);

  if (loading) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.boot}>
        <Text style={styles.title}>Wymagane logowanie</Text>
        <Text style={styles.sub}>Ta sekcja jest dostępna po zalogowaniu.</Text>
        <Pressable style={styles.btn} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.btnText}>ZALOGUJ SIĘ</Text>
        </Pressable>
      </View>
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <View style={styles.boot}>
        <Text style={styles.title}>Brak uprawnień</Text>
        <Text style={styles.sub}>Nie masz dostępu do tego panelu.</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 10,
  },
  title: { color: colors.text, fontWeight: "800", fontSize: 18 },
  sub: { color: colors.muted, textAlign: "center", marginBottom: 8 },
  btn: {
    backgroundColor: colors.gold,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: { color: colors.bg, fontWeight: "800" },
});
