import { Stack } from "expo-router";
import { PaperProvider, MD3DarkTheme } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { darkTheme } from "../styles/theme";

export default function RootLayout() {
  return (
    <PaperProvider theme={MD3DarkTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: darkTheme.background },
          headerTintColor: darkTheme.textPrimary,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </PaperProvider>
  );
}
