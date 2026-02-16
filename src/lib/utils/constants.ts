export const DEFAULT_CATEGORIES = [
  { name: "Housing", icon: "Home", colorToken: "chart-1" },
  { name: "Food & Dining", icon: "UtensilsCrossed", colorToken: "chart-2" },
  { name: "Transportation", icon: "Car", colorToken: "chart-3" },
  { name: "Entertainment", icon: "Gamepad2", colorToken: "chart-4" },
  { name: "Shopping", icon: "ShoppingBag", colorToken: "chart-5" },
  { name: "Health", icon: "Heart", colorToken: "chart-1" },
  { name: "Utilities", icon: "Zap", colorToken: "chart-2" },
  { name: "Subscriptions", icon: "RefreshCw", colorToken: "chart-3" },
  { name: "Education", icon: "GraduationCap", colorToken: "chart-4" },
  { name: "Other", icon: "MoreHorizontal", colorToken: "chart-5" },
];

export const CADENCE_LABELS: Record<string, string> = {
  weekly: "wk",
  monthly: "mo",
  yearly: "yr",
};

export const CADENCE_FULL_LABELS: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export const CURRENCIES = [
  { code: "USD", locale: "en-US", label: "US Dollar ($)" },
  { code: "EUR", locale: "de-DE", label: "Euro (\u20AC)" },
  { code: "GBP", locale: "en-GB", label: "British Pound (\u00A3)" },
  { code: "JPY", locale: "ja-JP", label: "Japanese Yen (\u00A5)" },
  { code: "CAD", locale: "en-CA", label: "Canadian Dollar (C$)" },
  { code: "AUD", locale: "en-AU", label: "Australian Dollar (A$)" },
  { code: "CHF", locale: "de-CH", label: "Swiss Franc (CHF)" },
  { code: "INR", locale: "en-IN", label: "Indian Rupee (\u20B9)" },
];

export const ICON_OPTIONS = [
  "Home",
  "UtensilsCrossed",
  "Car",
  "Gamepad2",
  "ShoppingBag",
  "Heart",
  "Zap",
  "RefreshCw",
  "GraduationCap",
  "MoreHorizontal",
  "Briefcase",
  "Plane",
  "Gift",
  "Music",
  "Film",
  "Coffee",
  "Shirt",
  "Dumbbell",
  "PiggyBank",
  "CreditCard",
];

export const COLOR_OPTIONS = [
  { token: "chart-1", label: "Indigo" },
  { token: "chart-2", label: "Green" },
  { token: "chart-3", label: "Orange" },
  { token: "chart-4", label: "Purple" },
  { token: "chart-5", label: "Teal" },
];
