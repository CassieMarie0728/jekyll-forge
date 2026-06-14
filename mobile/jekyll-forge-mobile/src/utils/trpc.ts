import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppRouter } from '../../../server/routers';

export const trpc = createTRPCReact<AppRouter>();

export const getTrpcClient = (token?: string) => {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/trpc',
        async headers() {
          const authToken = token || (await AsyncStorage.getItem('authToken'));
          return {
            authorization: authToken ? `Bearer ${authToken}` : '',
          };
        },
      }),
    ],
    transformer: superjson,
  });
};
