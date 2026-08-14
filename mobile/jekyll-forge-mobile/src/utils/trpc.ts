import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import * as SecureStore from "expo-secure-store";
import type { AppRouter } from "../../../../shared/mobileApi";

// `import type` is erased from the native bundle, keeping server-only runtime
// dependencies out of Android while enforcing the same tRPC contract at compile time.
const mobileTrpcFactory = createTRPCReact<AppRouter>();
export const trpc = mobileTrpcFactory;

const getTrpcUrl = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
  return configuredUrl.endsWith("/api/trpc")
    ? configuredUrl
    : `${configuredUrl.replace(/\/$/, "")}/api/trpc`;
};

export const getTrpcClient = (token?: string) => {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: getTrpcUrl(),
        transformer: superjson,
        async headers() {
          const authToken =
            token || (await SecureStore.getItemAsync("authToken"));
          return {
            authorization: authToken ? `Bearer ${authToken}` : "",
          };
        },
      }),
    ],
  });
};
