export const ksTokens = {
  color: {
    background: "bg-bg text-text",
    surface: "bg-surface",
    surfaceAlt: "bg-surface-2",
    border: "border-border",
    mutedText: "text-text-muted",
    primary: "text-primary-400",
    success: "text-success",
    warning: "text-warning",
    error: "text-error",
    info: "text-info"
  },
  typography: {
    bodySm: "text-sm",
    bodyMd: "text-base",
    headingSm: "text-2xl font-semibold tracking-tight",
    headingLg: "text-3xl font-bold tracking-tight sm:text-4xl"
  },
  spacing: {
    x1: "4px",
    x2: "8px",
    x3: "12px",
    x4: "16px",
    x5: "20px",
    x6: "24px",
    x8: "32px",
    x10: "40px",
    x12: "48px",
    x16: "64px"
  },
  radius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px"
  },
  shadow: {
    level0: "none",
    level1: "0 1px 2px rgba(0, 0, 0, 0.24)",
    level2: "0 8px 24px rgba(0, 0, 0, 0.28)",
    level3: "0 16px 40px rgba(0, 0, 0, 0.32)"
  },
  layout: {
    dashboardMaxWidth: "1440px",
    formMaxWidth: "720px"
  }
} as const;

export const ksClasses = {
  page: "min-h-screen bg-bg text-text",
  appContainer: "mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 py-6 sm:px-6 lg:px-8",
  authContainer: "mx-auto flex min-h-screen w-full max-w-[720px] flex-col px-4 py-8 sm:px-6 lg:px-8",
  card: "rounded-lg border border-border bg-surface shadow-1",
  focusRing: "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400",
  errorAlert: "rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
} as const;
