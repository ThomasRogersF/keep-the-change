import { format, isToday, isYesterday } from "date-fns";

export function formatCurrency(
  amount: number,
  currency = "USD",
  locale = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  const now = new Date();
  if (date.getFullYear() === now.getFullYear()) {
    return format(date, "MMM d");
  }
  return format(date, "MMM d, yyyy");
}

export function formatDateFull(date: Date): string {
  return format(date, "MMMM d, yyyy");
}

export function formatMonthLabel(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  return format(new Date(year, mon - 1, 1), "MMMM yyyy");
}

export function formatMonthShort(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  return format(new Date(year, mon - 1, 1), "MMM");
}
