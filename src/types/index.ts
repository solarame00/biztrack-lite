
export type ExpenseCategory =
  | "Office Supplies"
  | "Marketing"
  | "Software"
  | "Travel"
  | "Meals"
  | "Utilities"
  | "Rent"
  | "Salaries"
  | "Other";

export interface BaseEntry {
  id: string;
  amount: number;
  date: Date;
  note?: string; // Optional note for all transaction types
}

export interface Expense extends BaseEntry {
  type: "expense";
  name: string; // Name or label for the expense, e.g., "Facebook Ads"
  category: ExpenseCategory;
}

export interface CashTransaction extends BaseEntry {
  type: "cash-in" | "cash-out";
  name: string; // Name or label for the cash transaction, e.g., "Client Payment", "Withdrawal"
}

// Asset type removed

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

