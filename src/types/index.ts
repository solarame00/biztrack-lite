
export type Currency = "USD" | "GBP" | "EUR" | "MAD";

export interface Project {
  id: string;
  userId: string; // Added for user scoping
  name: string;
  description?: string;
}

export interface BaseEntry {
  id: string;
  projectId: string;
  userId: string; // Added for user scoping
  amount: number;
  date: Date; // Ensure date is always a Date object
  note?: string;
}

export interface Expense extends BaseEntry {
  type: "expense";
  name: string;
}

export interface CashTransaction extends BaseEntry {
  type: "cash-in" | "cash-out";
  name: string;
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