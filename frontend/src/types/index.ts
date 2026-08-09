// Shared TypeScript types for the ERP/CRM Portal

export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';
export type MovementType = 'IN' | 'OUT';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  businessName: string;
  gstNumber?: string;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; name: string };
  followUps?: CustomerFollowUp[];
  _count?: { challans: number };
}

export interface CustomerFollowUp {
  id: string;
  customerId: string;
  note: string;
  createdBy: string;
  createdAt: string;
  creator: { id: string; name: string };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number | string;
  currentStock: number;
  minStockAlert: number;
  location?: string;
  imageUrl?: string;
  isActive: boolean;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { stockMovements: number; challanItems: number };
}

export interface StockMovement {
  id: string;
  productId: string;
  quantityChanged: number;
  movementType: MovementType;
  reason: string;
  createdBy: string;
  createdAt: string;
  creator: { id: string; name: string };
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  customerSnapshot: CustomerSnapshot;
  status: ChallanStatus;
  totalQuantity: number;
  totalAmount: number | string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string; businessName: string; mobile?: string };
  creator?: { id: string; name: string };
  challanItems?: ChallanItem[];
  _count?: { challanItems: number };
}

export interface CustomerSnapshot {
  id: string;
  name: string;
  businessName: string;
  mobile: string;
  email?: string;
  address: string;
  gstNumber?: string;
}

export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string;
  productSnapshot: ProductSnapshot;
  quantity: number;
  unitPrice: number | string;
  totalPrice: number | string;
  product?: { id: string; name: string; sku: string; currentStock: number };
}

export interface ProductSnapshot {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
}

// API Response wrappers
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface ChallanFormItem {
  productId: string;
  quantity: number;
  product?: Product;
}
