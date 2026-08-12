import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import * as SecureStore from "expo-secure-store";
// Keep the mobile package independent from Node-only server sources. This adapter
// is the temporary boundary until a generated shared API contract is published.
const mobileTrpcFactory: any = createTRPCReact<any>();
export const trpc: any = mobileTrpcFactory;

export const getTrpcClient = (token?: string) => {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url:
          process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api/trpc",
        async headers() {
          const authToken = token || (await SecureStore.getItemAsync("authToken"));
          return {
            authorization: authToken ? `Bearer ${authToken}` : "",
          };
        },
      }),
    ],
    transformer: superjson,
  });
};
