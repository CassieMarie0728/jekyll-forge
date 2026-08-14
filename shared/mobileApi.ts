/**
 * Type-only API surface shared by the React web client and the Expo client.
 *
 * This export is intentionally type-only. It is erased from the Android bundle,
 * so native code never imports server modules or Node-only runtime dependencies.
 */
export type { AppRouter } from "../server/routers";
