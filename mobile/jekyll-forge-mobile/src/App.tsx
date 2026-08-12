import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { View, ActivityIndicator } from "react-native";
import { useAuthStore } from "./stores/authStore";
import { getTrpcClient, trpc } from "./utils/trpc";
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
        throw new Error(
          "Offline post publishing is not configured until the mobile GitHub publish contract is available."
        );
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
