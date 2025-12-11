import { Stack } from "expo-router";
import { PaperProvider, MD3DarkTheme } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { darkTheme } from "../styles/theme";

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#C1C1C1",
    onPrimary: "#000000",
    secondary: "#666666",
    surface: "#151515",
    surfaceVariant: "#1F1F1F",
    background: "#151515",
    outline: "#1F1F1F",
    onSurface: "#FFFFFF",
    onSurfaceVariant: "#B3B3B3",
  },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
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
    </GestureHandlerRootView>
  );
}
