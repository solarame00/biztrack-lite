
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
  // A simple safe check for amount being a valid number.
  const numericAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  
  const defaultOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  };

  // Using a simplified approach that prioritizes showing just the symbol and number
  // to avoid locale-specific additions like "US$"
  try {
     const formattedNumber = new Intl.NumberFormat(undefined, defaultOptions).format(numericAmount);
     return `${symbol}${formattedNumber}`;
  } catch (e) {
    // Fallback for any unexpected errors
    console.warn(`Intl.NumberFormat failed for currency: ${currency}. Using fallback formatting.`, e);
    return `${symbol}${numericAmount.toLocaleString(undefined, defaultOptions)}`;
  }
}

export const availableCurrencies: { value: Currency; label: string }[] = [
  { value: "USD", label: "USD ($) - United States Dollar" },
  { value: "EUR", label: "EUR (€) - Euro" },
  { value: "GBP", label: "GBP (£) - British Pound Sterling" },
  { value: "MAD", label: "MAD (DH) - Moroccan Dirham" },
];
