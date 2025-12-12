import { Tabs } from "expo-router";
import { useTheme } from "react-native-paper";

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { display: "none" },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTitleStyle: {
          color: theme.colors.primary,
          fontFamily: "PPNeueMontreal-Medium",
          fontSize: 16,
          letterSpacing: 0.64,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: "Timeline",
          headerTitle: "TIMELINE",
        }}
      />
    </Tabs>
  );
}
