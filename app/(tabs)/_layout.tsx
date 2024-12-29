import { Tabs, Redirect } from "expo-router";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.secondary,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTitleStyle: {
          color: theme.colors.primary,
        },
        headerShadowVisible: false,
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
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="clock-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="addEvent"
        options={{
          title: "Add Event",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="plus-circle-outline" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
}) {
  return (
    <MaterialCommunityIcons size={24} style={{ marginBottom: -3 }} {...props} />
  );
}

export function Index() {
  return <Redirect href="/timeline" />;
}
