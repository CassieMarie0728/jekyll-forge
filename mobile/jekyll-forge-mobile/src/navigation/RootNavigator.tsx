import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../stores/authStore';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EditorScreen from '../screens/EditorScreen';
import AssetManagerScreen from '../screens/AssetManagerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RepoPickerScreen from '../screens/RepoPickerScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: {
    backgroundColor: '#0f172a',
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: '600',
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
    fontSize: 12,
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
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <TabIcon icon="📊" color={color} />,
        }}
      />
      <Tab.Screen
        name="EditorTab"
        component={EditorScreen}
        options={{
          title: 'Editor',
          tabBarLabel: 'Editor',
          tabBarIcon: ({ color }) => <TabIcon icon="✍️" color={color} />,
        }}
      />
      <Tab.Screen
        name="AssetsTab"
        component={AssetManagerScreen}
        options={{
          title: 'Assets',
          tabBarLabel: 'Assets',
          tabBarIcon: ({ color }) => <TabIcon icon="📁" color={color} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
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

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return <View style={{ fontSize: 20 }}>{icon}</View>;
}

export default function RootNavigator() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

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
  );
}
