
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

  // Intl.NumberFormat is more robust for localization.
  // We can use it with a 'shim' for our custom symbols if needed, but for these currencies it's standard.
  // Using a try-catch block for safety in case of unsupported currency codes in some environments.
  try {
     return new Intl.NumberFormat(undefined, {
      ...defaultOptions,
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol' 
    }).format(numericAmount);
  } catch (e) {
    // Fallback for unsupported currency codes or other errors.
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
