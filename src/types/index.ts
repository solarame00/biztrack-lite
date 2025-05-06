
export type Currency = "USD" | "GBP" | "EUR" | "MAD";

export interface Project {
  id: string;
  name: string;
  description?: string;
}

export interface BaseEntry {
  id: string;
  projectId: string; // Added to associate with a project
  amount: number;
  date: Date;
  note?: string;
}

export interface Expense extends BaseEntry {
  type: "expense";
  name: string;
}

export interface CashTransaction extends BaseEntry {
  type: "cash-in" | "cash-out"; // cash-out is not used in forms but kept for type integrity
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

