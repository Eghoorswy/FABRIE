// src/types/finance.ts
export type CategoryType = "INCOME" | "EXPENSE";

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
}

export interface Transaction {
  id: number;
  category: number; // category ID
  category_name: string;
  category_type: CategoryType;
  amount: string; // Decimal as string from backend
  date: string; // ISO date string (YYYY-MM-DD)
  description: string;
}

export interface FinanceReport {
  total_income: string;
  total_expenses: string;
  net_profit: string;
  category_breakdown: Array<{
    category_name: string;
    category_type: CategoryType;
    total_amount: string;
  }>;
  time_period: {
    start_date: string | null;
    end_date: string | null;
  };
}

// Helper types for creating new entities
export type CreateCategoryData = Omit<Category, 'id'>;

export type CreateTransactionData = {
  category: number;
  amount: string;
  date: string;
  description: string;
};

export type UpdateTransactionData = Partial<Omit<Transaction, 'id' | 'category_name' | 'category_type'>>;