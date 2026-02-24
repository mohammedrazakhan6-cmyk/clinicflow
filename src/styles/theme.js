export const theme = {
  colors: {
    primary: {
      500: "#2B7A8E", // Dark Teal
      600: "#1A4F5C", // Darker Teal
      100: "#E2F0F9", // Light frost blue
    },
    accent: {
      500: "#60A5FA", // Light blue
    },
    neutral: {
      0: "#FFFFFF",
      50: "#F9FAFB",
      100: "#F3F4F6", // Light gray for cards
      200: "#E5E7EB",
      500: "#6B7280",
      700: "#374151",
      900: "#111827",
    },
    success: { 500: "#10B981" },
    warning: { 500: "#F59E0B" },
    error: { 500: "#EF4444" },
    info: { 500: "#3B82F6" },
  },
  typography: {
    fontFamily: "System", // Fallback, no custom font loaded to save time unless required
    h1: {
      fontSize: 32,
      fontWeight: "600",
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 24,
      fontWeight: "600",
      lineHeight: 32,
      letterSpacing: -0.5,
    },
    h3: {
      fontSize: 20,
      fontWeight: "600",
      lineHeight: 28,
      letterSpacing: -0.5,
    },
    bodyLg: {
      fontSize: 16,
      fontWeight: "400",
      lineHeight: 24,
      letterSpacing: 0,
    },
    bodyMd: {
      fontSize: 14,
      fontWeight: "400",
      lineHeight: 20,
      letterSpacing: 0,
    },
    caption: {
      fontSize: 12,
      fontWeight: "400",
      lineHeight: 16,
      letterSpacing: 0,
    },
    button: {
      fontSize: 16,
      fontWeight: "600",
      lineHeight: 24,
      letterSpacing: 0,
    },
  },
  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
  },
  shadow: {
    card: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    modal: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
    sticky: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 5,
    },
  },
};
