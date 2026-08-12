/**
 * Hub „Więcej” — menu nawigacji do konta, paneli ról, archiwum, legal.
 *
 * Rola w architekturze: soft role gates w UI (pokazuje Admin tylko ADMIN,
 * Organizer dla ORGANIZER|ADMIN, „Zostań organizatorem” dla USER).
 * Twarde gate’y są w App.tsx (RequireAuth) na docelowych ekranach.
 *
 * Pomysł (alt): drawer zamiast zakładki; deep links do paneli.
 */
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { ScreenHeader, GhostButton } from "../components/ui";
import { colors } from "../theme/colors";
import type { MoreStackParamList, RootStackParamList } from "../navigation/types";

export function MoreScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const Item = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <Pressable style={styles.item} onPress={onPress}>
      <Text style={styles.itemText}>{label}</Text>
      <Text style={styles.chev}>→</Text>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="WIĘCEJ"
        subtitle={user ? `${user.username} · ${user.role}` : "Gość"}
        right={
          !user ? <GhostButton label="Zaloguj" onPress={() => rootNav.navigate("Login")} /> : undefined
        }
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        {!user ? <Item label="Zaloguj / załóż konto" onPress={() => rootNav.navigate("Login")} /> : null}
        {user ? <Item label="Konto" onPress={() => navigation.navigate("Account")} /> : null}
        {user ? <Item label="Ustawienia" onPress={() => navigation.navigate("Settings")} /> : null}
        <Item label="Wyniki / archiwum" onPress={() => navigation.navigate("Results")} />
        <Item label="Archiwum wydarzeń" onPress={() => navigation.navigate("Archive")} />
        <Item label="Galeria (później)" onPress={() => navigation.navigate("Gallery")} />
        {user?.role === "USER" ? (
          <Item label="Zostań organizatorem" onPress={() => navigation.navigate("BecomeOrganizer")} />
        ) : null}
        {!user ? <Item label="Zostań organizatorem" onPress={() => rootNav.navigate("Login")} /> : null}
        {user?.role === "ORGANIZER" || user?.role === "ADMIN" ? (
          <Item label="Panel organizatora" onPress={() => navigation.navigate("Organizer")} />
        ) : null}
        {user?.role === "ADMIN" ? (
          <Item label="Panel admina" onPress={() => navigation.navigate("Admin")} />
        ) : null}
        <Item label="Regulamin" onPress={() => navigation.navigate("Legal", { kind: "terms" })} />
        <Item label="Prywatność" onPress={() => navigation.navigate("Legal", { kind: "privacy" })} />
        {user ? (
          <Pressable style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Wyloguj</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  item: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemText: { color: colors.text, fontWeight: "700", fontSize: 15 },
  chev: { color: colors.gold, fontWeight: "900" },
  logoutBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  logoutText: { color: colors.danger, fontWeight: "800", fontSize: 15 },
});
