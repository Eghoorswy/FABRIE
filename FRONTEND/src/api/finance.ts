import api from "@/lib/axios";
import { Category, Transaction, FinanceReport, CreateCategoryData, CreateTransactionData } from "@/types/finance";

// Category API calls
export const fetchCategories = async (): Promise<Category[]> => {
  const res = await api.get<Category[]>("/api/finance/categories/");
  return res.data;
};

export const createCategory = async (category: CreateCategoryData): Promise<Category> => {
  const res = await api.post<Category>("/api/finance/categories/", category);
  return res.data;
};

export const updateCategory = async (id: number, category: Partial<Category>): Promise<Category> => {
  const res = await api.patch<Category>(`/api/finance/categories/${id}/`, category);
  return res.data;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete(`/api/finance/categories/${id}/`);
};

// Transaction API calls
export const fetchTransactions = async (params?: { start_date?: string; end_date?: string }): Promise<Transaction[]> => {
  const res = await api.get<Transaction[]>("/api/finance/transactions/", { params });
  return res.data;
};

export const fetchTransaction = async (id: number): Promise<Transaction> => {
  const res = await api.get<Transaction>(`/api/finance/transactions/${id}/`);
  return res.data;
};

export const createTransaction = async (transaction: CreateTransactionData): Promise<Transaction> => {
  // Ensure proper data formatting
  const payload = {
    ...transaction,
    amount: transaction.amount, // Already string from form
    date: transaction.date, // Keep as-is (YYYY-MM-DD)
    description: transaction.description || ''
  };
  
  const res = await api.post<Transaction>("/api/finance/transactions/", payload);
  return res.data;
};

export const updateTransaction = async (id: number, transaction: Partial<Transaction>): Promise<Transaction> => {
  // Create a properly typed payload
  const payload: Record<string, any> = {};
  
  // Only include defined fields
  if (transaction.category !== undefined) {
    payload.category = typeof transaction.category === 'string' ? parseInt(transaction.category) : transaction.category;
  }
  
  if (transaction.amount !== undefined) {
    payload.amount = transaction.amount; // Already string from form
  }
  
  if (transaction.date !== undefined) {
    payload.date = transaction.date;
  }
  
  if (transaction.description !== undefined) {
    payload.description = transaction.description;
  }
  
  const res = await api.put<Transaction>(`/api/finance/transactions/${id}/`, payload);
  return res.data;
};

export const deleteTransaction = async (id: number): Promise<void> => {
  await api.delete(`/api/finance/transactions/${id}/`);
};

// Report API call
export const fetchFinanceReport = async (startDate?: string, endDate?: string): Promise<FinanceReport> => {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  
  const res = await api.get<FinanceReport>("/api/finance/report/", { params });
  return res.data;
};