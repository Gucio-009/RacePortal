import { ActivityIndicator, View, StyleSheet, Text } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { LoginScreen } from "./src/screens/LoginScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";
import { ForgotPasswordScreen } from "./src/screens/ForgotPasswordScreen";
import { EventsScreen } from "./src/screens/EventsScreen";
import { EventDetailScreen } from "./src/screens/EventDetailScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { GarageScreen } from "./src/screens/GarageScreen";
import { MoreScreen } from "./src/screens/MoreScreen";
import { AccountScreen } from "./src/screens/AccountScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { AdminScreen } from "./src/screens/AdminScreen";
import { OrganizerScreen } from "./src/screens/OrganizerScreen";
import { BecomeOrganizerScreen } from "./src/screens/BecomeOrganizerScreen";
import { ArchiveScreen, ResultsScreen } from "./src/screens/ArchiveScreen";
import { GalleryScreen } from "./src/screens/GalleryScreen";
import { LegalScreen } from "./src/screens/LegalScreen";
import { colors } from "./src/theme/colors";
import type {
  EventsStackParamList,
  MainTabParamList,
  MoreStackParamList,
  RootStackParamList,
} from "./src/navigation/types";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const EventsStack = createNativeStackNavigator<EventsStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

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

const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.card },
  headerTintColor: colors.gold,
  headerTitleStyle: { color: colors.text, fontWeight: "800" as const },
};

function EventsNavigator() {
  return (
    <EventsStack.Navigator screenOptions={stackScreenOptions}>
      <EventsStack.Screen name="EventsList" component={EventsScreen} options={{ headerShown: false }} />
      <EventsStack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: "Szczegóły" }} />
    </EventsStack.Navigator>
  );
}

function MoreNavigator() {
  return (
    <MoreStack.Navigator screenOptions={stackScreenOptions}>
      <MoreStack.Screen name="MoreHome" component={MoreScreen} options={{ headerShown: false }} />
      <MoreStack.Screen name="Account" component={AccountScreen} options={{ title: "Konto" }} />
      <MoreStack.Screen name="Settings" component={SettingsScreen} options={{ title: "Ustawienia" }} />
      <MoreStack.Screen name="Admin" component={AdminScreen} options={{ title: "Admin" }} />
      <MoreStack.Screen name="Organizer" component={OrganizerScreen} options={{ title: "Organizator" }} />
      <MoreStack.Screen
        name="BecomeOrganizer"
        component={BecomeOrganizerScreen}
        options={{ title: "Organizator" }}
      />
      <MoreStack.Screen name="Archive" component={ArchiveScreen} options={{ title: "Archiwum" }} />
      <MoreStack.Screen name="Results" component={ResultsScreen} options={{ title: "Wyniki" }} />
      <MoreStack.Screen name="Gallery" component={GalleryScreen} options={{ title: "Galeria" }} />
      <MoreStack.Screen name="Legal" component={LegalScreen} options={{ title: "Informacje" }} />
      <MoreStack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: "Szczegóły" }} />
    </MoreStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen
        name="EventsTab"
        component={EventsNavigator}
        options={{
          title: "Eventy",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>🏁</Text>,
        }}
      />
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          title: "Moje",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>📋</Text>,
        }}
      />
      <Tab.Screen
        name="GarageTab"
        component={GarageScreen}
        options={{
          title: "Garaż",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>🚗</Text>,
        }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreNavigator}
        options={{
          title: "Więcej",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>☰</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  // Gość widzi Eventy (jak web); Login/Register jako stack overlay.
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Main" component={MainTabs} />
      <RootStack.Screen name="Login" component={LoginScreen} options={{ presentation: "modal", headerShown: true, title: "Logowanie", ...stackScreenOptions }} />
      <RootStack.Screen name="Register" component={RegisterScreen} options={{ presentation: "modal", headerShown: true, title: "Rejestracja", ...stackScreenOptions }} />
      <RootStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ presentation: "modal", headerShown: true, title: "Reset hasła", ...stackScreenOptions }}
      />
    </RootStack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" },
});
