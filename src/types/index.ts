

export type Currency = "USD" | "GBP" | "EUR" | "MAD";
export type TrackingPreference = "revenueAndExpenses" | "expensesOnly" | "revenueOnly";

export interface Project {
  id: string;
  userId: string; 
  name: string;
  description?: string;
  projectType: "personal" | "business";
  trackingPreference: TrackingPreference;
}

export interface BaseEntry {
  id: string;
  projectId: string;
  userId: string; 
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
export type FilterType = "period" | "date" | "range" | "transactionType";

export interface DateFilter {
  type: FilterType;
  period?: FilterPeriod;
  specificDate?: Date;
  startDate?: Date;
  endDate?: Date;
  transactionType?: Transaction['type'];
}
