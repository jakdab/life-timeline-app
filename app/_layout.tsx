import { Stack } from "expo-router";
import { PaperProvider, MD3DarkTheme } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";
import { darkTheme } from "../styles/theme";
import NoiseOverlay from "../components/NoiseOverlay";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

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
  fonts: {
    ...MD3DarkTheme.fonts,
    default: {
      fontFamily: "PPNeueMontreal-Medium",
    },
    bodyLarge: {
      fontFamily: "PPNeueMontreal-Medium",
      fontWeight: "400" as const,
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0.5,
    },
    bodyMedium: {
      fontFamily: "PPNeueMontreal-Medium",
      fontWeight: "400" as const,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.25,
    },
    bodySmall: {
      fontFamily: "PPNeueMontreal-Medium",
      fontWeight: "400" as const,
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.4,
    },
    labelLarge: {
      fontFamily: "PPNeueMontreal-Medium",
      fontWeight: "500" as const,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    titleLarge: {
      fontFamily: "PPNeueMontreal-Medium",
      fontWeight: "500" as const,
      fontSize: 22,
      lineHeight: 28,
      letterSpacing: 0,
    },
    titleMedium: {
      fontFamily: "PPNeueMontreal-Medium",
      fontWeight: "500" as const,
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0.15,
    },
    headlineLarge: {
      fontFamily: "PPNeueMontreal-Medium",
      fontWeight: "500" as const,
      fontSize: 32,
      lineHeight: 40,
      letterSpacing: 0,
    },
    headlineMedium: {
      fontFamily: "PPNeueMontreal-Medium",
      fontWeight: "500" as const,
      fontSize: 28,
      lineHeight: 36,
      letterSpacing: 0,
    },
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "PPNeueMontreal-Thin": require("../assets/fonts/PPNeueMontreal-Thin.otf"),
    "PPNeueMontreal-Book": require("../assets/fonts/PPNeueMontreal-Book.otf"),
    "PPNeueMontreal-Medium": require("../assets/fonts/PPNeueMontreal-Medium.otf"),
    "PPNeueMontreal-Bold": require("../assets/fonts/PPNeueMontreal-Bold.otf"),
    "PPNeueMontreal-Italic": require("../assets/fonts/PPNeueMontreal-Italic.otf"),
    "PPNeueMontreal-SemiBolditalic": require("../assets/fonts/PPNeueMontreal-SemiBolditalic.otf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Don't render until fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <View style={{ flex: 1 }}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: darkTheme.background },
              headerTintColor: darkTheme.textPrimary,
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="addEvent"
              options={{
                presentation: "modal",
                headerShown: false,
              }}
            />
          </Stack>
          {/* Global noise texture overlay - visual only, doesn't block touches */}
          {/* Settings: 30% opacity, Multiply blend mode, 50% scale pattern */}
          <NoiseOverlay opacity={0.3} />
        </View>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
