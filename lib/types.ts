export type UserRole = "admin" | "price_manager" | "staff";

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  banned: boolean;
}

export interface Product {
  id: string;
  name: string;
  priceUnit: string;
  unitName: string;
  priceBulk: string;
  bulkName: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  amount: string;
  note?: string;
  paidAt: string;
}

export interface DebtEntry {
  id: string;
  customerName: string;
  totalDebt: string;
  amountPaid: string;
  balance: string;
  notes?: string;
  createdBy: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  payments: Payment[];
}

export type StockStatus = "LOW_STOCK" | "OUT_OF_STOCK" | "RESTOCKED";

export interface InventoryItem {
  id: string;
  itemName: string;
  status: StockStatus;
  quantity: number;
  reporterName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSuggestion {
  id: string;
  name: string;
  priceUnit: string;
  unitName: string;
  priceBulk: string;
  bulkName: string;
}

export type CustomerSuggestion = string;
