import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from './stores/authStore';
import { trpc } from './utils/trpc';
import RootNavigator from './navigation/RootNavigator';
import { ToastProvider } from './components/Toast';
import { haptics } from './utils/haptics';

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

interface AppContentProps {
  isAuthenticated: boolean;
}

function AppContent({ isAuthenticated }: AppContentProps) {
  const { isLoading, checkAuth } = useAuthStore();
  const trpcClient = getTrpcClient();

  useEffect(() => {
    checkAuth();
    haptics.initialize();
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
        <RootNavigator isAuthenticated={isAuthenticated} />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default function App() {
  const { isAuthenticated } = useAuthStore();
  return (
    <ToastProvider>
      <AppContent isAuthenticated={isAuthenticated} />
    </ToastProvider>
  );
}
