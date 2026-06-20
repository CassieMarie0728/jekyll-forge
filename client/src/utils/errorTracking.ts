import * as Sentry from '@sentry/react';

/**
 * Initialize error tracking with Sentry
 * Configuration can be customized via environment variables
 */
export function initializeErrorTracking() {
  const sentryDSN = import.meta.env.VITE_SENTRY_DSN;

  if (!sentryDSN) {
    console.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: sentryDSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Filter out certain errors
      if (event.exception) {
        const exceptions = event.exception?.values || [];
        const message = exceptions[0]?.value || '';

        // Don't send network errors for rate limiting
        if (message.includes('429')) {
          return null;
        }

        // Don't send auth errors
        if (message.includes('401')) {
          return null;
        }
      }

      return event;
    },
  });
}

/**
 * Capture an exception with context
 */
export function captureException(
  error: Error,
  context?: Record<string, any>
) {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
) {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context
 */
export function setUserContext(userId: string, email?: string, name?: string) {
  Sentry.setUser({
    id: userId,
    email,
    username: name,
  });
}

/**
 * Clear user context
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(
  message: string,
  category: string = 'user-action',
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Error boundary wrapper component
 */
export const ErrorBoundary = Sentry.ErrorBoundary;
