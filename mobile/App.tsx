import { ActivityIndicator, View, StyleSheet } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { LoginScreen } from "./src/screens/LoginScreen";
import { EventsScreen } from "./src/screens/EventsScreen";
import { EventDetailScreen } from "./src/screens/EventDetailScreen";
import { colors } from "./src/theme/colors";

export type RootStackParamList = {
  Events: undefined;
  EventDetail: { id: string };
  Login: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

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

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {user ? (
        <>
          <Stack.Screen name="Events" component={EventsScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="EventDetail"
            component={EventDetailScreen}
            options={{
              title: "Szczegóły",
              headerStyle: { backgroundColor: colors.card },
              headerTintColor: colors.gold,
              headerTitleStyle: { color: colors.text, fontWeight: "800" },
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
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
