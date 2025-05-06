
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
  note?: string; // Optional note, can be used for additional details if needed
}

export interface Expense extends BaseEntry {
  type: "expense";
  name: string; // Name or label for the expense, e.g., "Facebook Ads"
  category: ExpenseCategory;
}

export interface CashTransaction extends BaseEntry {
  type: "cash-in" | "cash-out";
  source: string; // Source of cash-in or purpose of cash-out
}

export interface Asset extends BaseEntry {
  type: "asset";
  name: string; // Name of the asset, e.g., "Laptop"
  purchaseDate?: Date; 
}

export type Transaction = Expense | CashTransaction | Asset;


export type FilterPeriod = "today" | "thisWeek" | "thisMonth" | "allTime";
export type FilterType = "period" | "date" | "range";

export interface DateFilter {
  type: FilterType;
  period?: FilterPeriod;
  specificDate?: Date;
  startDate?: Date;
  endDate?: Date;
}
