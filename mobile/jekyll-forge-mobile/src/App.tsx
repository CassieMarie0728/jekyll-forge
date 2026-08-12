import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { View, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "./stores/authStore";
import { trpc } from "./utils/trpc";
import RootNavigator from "./navigation/RootNavigator";
import { ToastProvider } from "./components/Toast";
import { haptics } from "./utils/haptics";
import { syncService } from "./services/syncService";
import { pushNotificationService } from "./services/pushNotifications";

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
        url:
          process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api/trpc",
        async headers() {
          const token = await SecureStore.getItemAsync("authToken");
          return {
            authorization: token ? `Bearer ${token}` : "",
          };
        },
      }),
    ],
    transformer: superjson,
  });
};

function AppContent() {
  const { isLoading, checkAuth } = useAuthStore();
  const trpcClient = getTrpcClient();

  syncService.configureProcessor(async item => {
    const client = trpcClient as any;
    switch (item.action) {
      case "create":
        await client.posts.upsert.mutate(item.data);
        return;
      case "update":
        await client.posts.update.mutate(item.data);
        return;
      case "publish":
        await client.socialMedia.publishContent.mutate(item.data);
        return;
      case "delete":
        await client.posts.delete.mutate(item.data);
        return;
      default:
        throw new Error(`Unsupported offline action: ${String(item.action)}`);
    }
  });

  useEffect(() => {
    checkAuth();
    haptics.initialize();
    pushNotificationService.configureClient(trpcClient);
    void pushNotificationService.initialize();
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f172a",
        }}
      >
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
