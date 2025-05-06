
export type Currency = "USD" | "GBP" | "EUR" | "MAD";

// ExpenseCategory type removed

export interface BaseEntry {
  id: string;
  amount: number;
  date: Date;
  note?: string; // Optional note for all transaction types
}

export interface Expense extends BaseEntry {
  type: "expense";
  name: string; // Name or label for the expense, e.g., "Facebook Ads"
  // category: ExpenseCategory; // Category removed
}

export interface CashTransaction extends BaseEntry {
  type: "cash-in" | "cash-out";
  name: string; // Name or label for the cash transaction, e.g., "Client Payment", "Withdrawal"
}

export type Transaction = Expense | CashTransaction;


export type FilterPeriod = "today" | "thisWeek" | "thisMonth" | "allTime";
export type FilterType = "period" | "date" | "range";

export interface DateFilter {
  type: FilterType;
  period?: FilterPeriod;
  specificDate?: Date;
  startDate?: Date;
  endDate?: Date;
}

