import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions for performance monitoring

  // Session Replay - capture user sessions on errors
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Don't send PII
  sendDefaultPii: false,

  // Filter out noisy errors
  ignoreErrors: [
    // Network errors
    "Failed to fetch",
    "NetworkError",
    "Load failed",
    // User cancelled
    "AbortError",
    // Browser extensions
    "chrome-extension://",
    "moz-extension://",
    // Safari
    "ResizeObserver loop",
  ],

  // Capture breadcrumbs for context
  beforeBreadcrumb(breadcrumb) {
    // Don't capture console.debug
    if (breadcrumb.category === "console" && breadcrumb.level === "debug") {
      return null;
    }
    return breadcrumb;
  },
});
