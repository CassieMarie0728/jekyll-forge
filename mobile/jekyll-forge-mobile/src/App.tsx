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
import { replayOfflineQueueItem } from "./services/offlineReplayDispatcher";

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

  syncService.configureProcessor(item => replayOfflineQueueItem(trpcClient, item));

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
