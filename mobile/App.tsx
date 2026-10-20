/**
 * RacePortal Mobile — aplikacja-wizytówka (Expo).
 *
 * Tylko publiczny katalog wydarzeń (lista / mapa / kalendarz + detal).
 * Logowanie, garaż, zgłoszenia — wyłącznie na webie (CTA z detalu).
 */
import { Text, StyleSheet } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
import { EventsScreen } from "./src/screens/EventsScreen";
import { EventDetailScreen } from "./src/screens/EventDetailScreen";
import { colors } from "./src/theme/colors";
import type { EventsStackParamList } from "./src/navigation/types";

const EventsStack = createNativeStackNavigator<EventsStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    primary: colors.gold,
  },
};

function EventsNavigator() {
  const { accentColor } = useTheme();
  return (
    <EventsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: accentColor,
        headerTitleStyle: { color: colors.text, fontWeight: "800" },
      }}
    >
      <EventsStack.Screen name="EventsList" component={EventsScreen} options={{ headerShown: false }} />
      <EventsStack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: "Szczegóły" }} />
    </EventsStack.Navigator>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="light" />
        <EventsNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}
