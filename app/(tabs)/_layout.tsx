import { Tabs, Redirect } from "expo-router";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#C1C1C1", // Your primary color
    background: "#151515", // Your background color
    card: "#151515", // Matching background for consistency
    text: "#C1C1C1", // Matching primary for text
    border: "#1F1F1F", // Your border color
  },
};

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTitleStyle: {
          color: theme.colors.primary,
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
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="timeline" color={color} />
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
