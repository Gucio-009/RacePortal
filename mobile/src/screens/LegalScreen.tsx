import { ScrollView, Text, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../theme/colors";
import type { MoreStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "Legal">;

export function LegalScreen({ route }: Props) {
  const terms = route.params.kind === "terms";
  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>{terms ? "Regulamin" : "Polityka prywatności"}</Text>
      <Text style={styles.body}>
        {terms
          ? "Korzystając z RacePortal akceptujesz zasady korzystania z serwisu, zgłoszeń na wydarzenia oraz odpowiedzialności uczestnika. Pełna treść prawna jest dostępna też na stronie web."
          : "Przetwarzamy dane konta (e-mail, profil, garaż, zgłoszenia) w celu świadczenia usługi RacePortal. Szczegóły jak na stronie /privacy."}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 22, fontWeight: "900", marginBottom: 12 },
  body: { color: colors.muted, lineHeight: 22 },
});
