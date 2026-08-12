import { useEffect } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, View, Text, StyleSheet } from "react-native";
import { useAuthStore } from "../stores/authStore";

// Screens
import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import EditorScreen from "../screens/EditorScreen";
import AssetManagerScreen from "../screens/AssetManagerScreen";
import SettingsScreen from "../screens/SettingsScreen";
import RepoPickerScreen from "../screens/RepoPickerScreen";
import PublishScreen from "../screens/PublishScreen";
import AIAssistantScreen from "../screens/AIAssistantScreen";
import RepurposingScreen from "../screens/RepurposingScreen";
import ABTestingScreen from "../screens/ABTestingScreen";
import SocialPublishScreen from "../screens/SocialPublishScreen";
import SocialAnalyticsScreen from "../screens/SocialAnalyticsScreen";
import ScheduledPostsScreen from "../screens/ScheduledPostsScreen";
import NotificationsScreen from "../screens/NotificationsScreen";

// Dark Theme
const JekyllForgeDarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: "#3b82f6",
    background: "#0f172a",
    card: "#1e293b",
    text: "#ffffff",
    border: "#334155",
    notification: "#ef4444",
  },
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Polished screen options with smooth transitions
const screenOptions = {
  headerStyle: {
    backgroundColor: "#0f172a",
  },
  headerTintColor: "#fff",
  headerTitleStyle: {
    fontWeight: "600" as const,
    fontSize: 17,
  },
  headerShadowVisible: false,
  contentStyle: {
    backgroundColor: "#0f172a",
  },
  animation: "slide_from_right" as const,
  animationDuration: 250,
  gestureEnabled: true,
};

// Tab icon with active indicator
function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View
      style={[
        tabStyles.iconContainer,
        focused && tabStyles.iconContainerActive,
      ]}
    >
      <Text style={[tabStyles.icon, focused && tabStyles.iconFocused]}>
        {icon}
      </Text>
    </View>
  );
}

// Auth Stack
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ ...screenOptions, animation: "fade" }}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Repo Picker Stack
function RepoPickerStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="RepoPicker"
        component={RepoPickerScreen}
        options={{ title: "Select Repository" }}
      />
    </Stack.Navigator>
  );
}

// Main App Tabs with polished styling
function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600", fontSize: 17 },
        headerShadowVisible: false,
        tabBarStyle: tabStyles.tabBar,
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#6b7280",
        tabBarLabelStyle: tabStyles.tabLabel,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          title: "Dashboard",
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="EditorTab"
        component={EditorScreen}
        options={{
          title: "Editor",
          tabBarLabel: "Editor",
          tabBarIcon: ({ focused }) => <TabIcon icon="✍️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AssetsTab"
        component={AssetManagerScreen}
        options={{
          title: "Assets",
          tabBarLabel: "Assets",
          tabBarIcon: ({ focused }) => <TabIcon icon="📁" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Root Navigator with all screens
export default function RootNavigator() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={loadingStyles.container}>
        <View style={loadingStyles.logoContainer}>
          <Text style={loadingStyles.logo}>⚒️</Text>
          <Text style={loadingStyles.appName}>Jekyll Forge</Text>
        </View>
        <ActivityIndicator
          size="large"
          color="#3b82f6"
          style={loadingStyles.spinner}
        />
      </View>
    );
  }

  return (
    <NavigationContainer theme={JekyllForgeDarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen
            name="AuthStack"
            component={AuthStack}
            options={{ animation: "fade" }}
          />
        ) : (
          <>
            <Stack.Screen
              name="RepoPickerStack"
              component={RepoPickerStack}
              options={{ animation: "fade" }}
            />
            <Stack.Screen
              name="AppStack"
              component={AppTabs}
              options={{ animation: "fade" }}
            />
            {/* Modal screens - slide from bottom */}
            <Stack.Screen
              name="Publish"
              component={PublishScreen}
              options={{
                headerShown: true,
                headerTitle: "Publish Post",
                ...screenOptions,
                animation: "slide_from_bottom",
                presentation: "modal",
              }}
            />
            <Stack.Screen
              name="AIAssistant"
              component={AIAssistantScreen}
              options={{
                headerShown: true,
                headerTitle: "AI Assistant",
                ...screenOptions,
                animation: "slide_from_bottom",
                presentation: "modal",
              }}
            />
            <Stack.Screen
              name="SocialPublish"
              component={SocialPublishScreen}
              options={{
                headerShown: true,
                headerTitle: "Publish to Social",
                ...screenOptions,
                animation: "slide_from_bottom",
                presentation: "modal",
              }}
            />
            {/* Push screens - slide from right */}
            <Stack.Screen
              name="Repurposing"
              component={RepurposingScreen}
              options={{
                headerShown: true,
                headerTitle: "Repurpose Content",
                ...screenOptions,
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="ABTesting"
              component={ABTestingScreen}
              options={{
                headerShown: true,
                headerTitle: "A/B Testing",
                ...screenOptions,
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="SocialAnalytics"
              component={SocialAnalyticsScreen}
              options={{
                headerShown: true,
                headerTitle: "Social Analytics",
                ...screenOptions,
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="ScheduledPosts"
              component={ScheduledPostsScreen}
              options={{
                headerShown: true,
                headerTitle: "Scheduled Posts",
                ...screenOptions,
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{
                headerShown: true,
                headerTitle: "Notifications",
                ...screenOptions,
                animation: "slide_from_right",
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const tabStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#1e293b",
    borderTopColor: "#334155",
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerActive: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
  },
  icon: {
    fontSize: 18,
  },
  iconFocused: {
    fontSize: 20,
  },
});

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    fontSize: 48,
    marginBottom: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  spinner: {
    marginTop: 16,
  },
});
