
import type { Currency } from "@/types";

export function getCurrencySymbol(currency: Currency): string {
  switch (currency) {
    case "USD":
      return "$";
    case "GBP":
      return "£";
    case "EUR":
      return "€";
    case "MAD":
      return "DH"; // Dirham Marocain
    default:
      return "$";
  }
}

export function formatCurrency(
  amount: number,
  currency: Currency,
  options?: Intl.NumberFormatOptions
): string {
  const symbol = getCurrencySymbol(currency);
  const defaultOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  };
  // Simple formatting, assuming symbol comes before the number.
  // For more robust international formatting, Intl.NumberFormat with style 'currency' would be better,
  // but that requires the currency code itself (e.g., "USD", "EUR").
  return `${symbol}${amount.toLocaleString(undefined, defaultOptions)}`;
}

export const availableCurrencies: { value: Currency; label: string }[] = [
  { value: "USD", label: "USD ($) - United States Dollar" },
  { value: "EUR", label: "EUR (€) - Euro" },
  { value: "GBP", label: "GBP (£) - British Pound Sterling" },
  { value: "MAD", label: "MAD (DH) - Moroccan Dirham" },
];
