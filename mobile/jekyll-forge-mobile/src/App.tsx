import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { ActivityIndicator, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from './stores/authStore';
import { trpc } from './utils/trpc';

// Screens
import LoginScreen from './screens/LoginScreen';
import RepoPickerScreen from './screens/RepoPickerScreen';
import DashboardScreen from './screens/DashboardScreen';
import EditorScreen from './screens/EditorScreen';
import AssetManagerScreen from './screens/AssetManagerScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

const getTrpcClient = () => {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/trpc',
        async headers() {
          const token = await AsyncStorage.getItem('authToken');
          return {
            authorization: token ? `Bearer ${token}` : '',
          };
        },
      }),
    ],
    transformer: superjson,
  });
};

const screenOptions = {
  headerStyle: {
    backgroundColor: '#0f172a',
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: '600',
    fontSize: 16,
  },
  headerShadowVisible: false,
  cardStyle: {
    backgroundColor: '#0f172a',
  },
};

const tabScreenOptions = {
  headerShown: true,
  tabBarStyle: {
    backgroundColor: '#1e293b',
    borderTopColor: '#334155',
    borderTopWidth: 1,
  },
  tabBarActiveTintColor: '#3b82f6',
  tabBarInactiveTintColor: '#6b7280',
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: '500',
  },
};

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function RepoPickerStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="RepoPicker"
        component={RepoPickerScreen}
        options={{ title: 'Select Repository' }}
      />
    </Stack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        ...tabScreenOptions,
        headerStyle: screenOptions.headerStyle,
        headerTintColor: screenOptions.headerTintColor,
        headerTitleStyle: screenOptions.headerTitleStyle,
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <TabIcon icon="📊" color={color} />,
        }}
      />
      <Tab.Screen
        name="Editor"
        component={EditorScreen}
        options={{
          title: 'Editor',
          tabBarLabel: 'Editor',
          tabBarIcon: ({ color }) => <TabIcon icon="✍️" color={color} />,
        }}
      />
      <Tab.Screen
        name="Assets"
        component={AssetManagerScreen}
        options={{
          title: 'Assets',
          tabBarLabel: 'Assets',
          tabBarIcon: ({ color }) => <TabIcon icon="📁" color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon icon="⚙️" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function TabIcon({ icon }: { icon: string; color: string }) {
  return <Text style={{ fontSize: 18 }}>{icon}</Text>;
}

export default function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const trpcClient = getTrpcClient();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
              <Stack.Screen name="AuthStack" component={AuthStack} />
            ) : (
              <>
                <Stack.Screen name="RepoPickerStack" component={RepoPickerStack} />
                <Stack.Screen name="AppStack" component={AppTabs} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
