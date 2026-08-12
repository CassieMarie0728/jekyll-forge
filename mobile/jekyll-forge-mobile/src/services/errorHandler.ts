import { Alert } from "react-native";
import { haptics } from "../utils/haptics";

// Error types for categorization
export type ErrorCategory =
  | "network"
  | "auth"
  | "validation"
  | "server"
  | "storage"
  | "permission"
  | "unknown";

export interface AppError {
  category: ErrorCategory;
  message: string;
  userMessage: string;
  code?: string;
  retryable: boolean;
  originalError?: Error;
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return new Error((error as { message: string }).message);
  }
  return new Error("Unknown mobile application error");
}

// Parse errors into user-friendly messages
export function parseError(error: unknown): AppError {
  // Network errors
  if (
    error instanceof TypeError &&
    error.message.includes("Network request failed")
  ) {
    return {
      category: "network",
      message: error.message,
      userMessage:
        "No internet connection. Please check your network and try again.",
      retryable: true,
      originalError: error,
    };
  }

  // Timeout errors
  if (error instanceof Error && error.message.includes("timeout")) {
    return {
      category: "network",
      message: error.message,
      userMessage: "Request timed out. Please try again.",
      retryable: true,
      originalError: error,
    };
  }

  // tRPC errors
  if (error && typeof error === "object" && "data" in error) {
    const trpcError = error as any;
    const code = trpcError.data?.code;

    switch (code) {
      case "UNAUTHORIZED":
        return {
          category: "auth",
          message: trpcError.message || "Unauthorized",
          userMessage: "Your session has expired. Please log in again.",
          code,
          retryable: false,
          originalError: normalizeError(error),
        };
      case "FORBIDDEN":
        return {
          category: "auth",
          message: trpcError.message || "Forbidden",
          userMessage: "You don't have permission to perform this action.",
          code,
          retryable: false,
          originalError: normalizeError(error),
        };
      case "NOT_FOUND":
        return {
          category: "server",
          message: trpcError.message || "Not found",
          userMessage: "The requested item was not found.",
          code,
          retryable: false,
          originalError: normalizeError(error),
        };
      case "BAD_REQUEST":
        return {
          category: "validation",
          message: trpcError.message || "Bad request",
          userMessage:
            trpcError.message ||
            "Invalid input. Please check your data and try again.",
          code,
          retryable: false,
          originalError: normalizeError(error),
        };
      case "INTERNAL_SERVER_ERROR":
        return {
          category: "server",
          message: trpcError.message || "Server error",
          userMessage:
            "Something went wrong on our end. Please try again later.",
          code,
          retryable: true,
          originalError: normalizeError(error),
        };
      case "TOO_MANY_REQUESTS":
        return {
          category: "server",
          message: trpcError.message || "Rate limited",
          userMessage:
            "You're making too many requests. Please wait a moment and try again.",
          code,
          retryable: true,
          originalError: normalizeError(error),
        };
      default:
        return {
          category: "server",
          message: trpcError.message || "Unknown server error",
          userMessage:
            trpcError.message ||
            "An unexpected error occurred. Please try again.",
          code,
          retryable: true,
          originalError: normalizeError(error),
        };
    }
  }

  // Storage errors
  if (error instanceof Error && error.message.includes("AsyncStorage")) {
    return {
      category: "storage",
      message: error.message,
      userMessage:
        "Unable to save data locally. Please free up some storage space.",
      retryable: true,
      originalError: error,
    };
  }

  // Permission errors
  if (error instanceof Error && error.message.includes("permission")) {
    return {
      category: "permission",
      message: error.message,
      userMessage:
        "Permission denied. Please grant the required permissions in Settings.",
      retryable: false,
      originalError: error,
    };
  }

  // Generic errors
  if (error instanceof Error) {
    return {
      category: "unknown",
      message: error.message,
      userMessage: "Something went wrong. Please try again.",
      retryable: true,
      originalError: error,
    };
  }

  return {
    category: "unknown",
    message: String(error),
    userMessage: "An unexpected error occurred.",
    retryable: true,
  };
}

// Show error alert with retry option
export async function showErrorAlert(
  error: AppError,
  onRetry?: () => void,
  onDismiss?: () => void
): Promise<void> {
  // Trigger haptic feedback for error
  await haptics.error();

  const buttons: any[] = [];

  if (error.retryable && onRetry) {
    buttons.push({
      text: "Retry",
      onPress: async () => {
        await haptics.buttonTap();
        onRetry();
      },
    });
  }

  buttons.push({
    text: "OK",
    onPress: async () => {
      await haptics.buttonTap();
      onDismiss?.();
    },
    style: "cancel",
  });

  Alert.alert("Error", error.userMessage, buttons);
}

// Retry logic with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const parsedError = parseError(error);

      if (!parsedError.retryable || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Global error handler for unhandled errors
export function setupGlobalErrorHandler(): void {
  const originalHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    console.error("[Global Error]", error.message, { isFatal });

    if (isFatal) {
      haptics.error();
      Alert.alert(
        "Unexpected Error",
        "The app encountered a critical error. Please restart the app.",
        [{ text: "OK" }]
      );
    }

    originalHandler(error, isFatal);
  });
}
