
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
  note?: string;
}

export interface Expense extends BaseEntry {
  type: "expense";
  category: ExpenseCategory;
}

export interface CashTransaction extends BaseEntry {
  type: "cash-in" | "cash-out";
  source: string; // Replaces 'note' for clarity, can be 'Client Payment', 'Withdrawal', etc.
}

export interface Asset extends BaseEntry {
  type: "asset";
  name: string;
  purchaseDate?: Date; // Renamed from form's 'purchaseDate' for consistency, maps to form's 'value'
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
