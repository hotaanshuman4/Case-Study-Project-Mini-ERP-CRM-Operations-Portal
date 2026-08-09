export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';
export type MovementType = 'IN' | 'OUT';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export const Role = {
  ADMIN: 'ADMIN' as const,
  SALES: 'SALES' as const,
  WAREHOUSE: 'WAREHOUSE' as const,
  ACCOUNTS: 'ACCOUNTS' as const,
};

export const CustomerType = {
  RETAIL: 'RETAIL' as const,
  WHOLESALE: 'WHOLESALE' as const,
  DISTRIBUTOR: 'DISTRIBUTOR' as const,
};

export const CustomerStatus = {
  LEAD: 'LEAD' as const,
  ACTIVE: 'ACTIVE' as const,
  INACTIVE: 'INACTIVE' as const,
};

export const MovementType = {
  IN: 'IN' as const,
  OUT: 'OUT' as const,
};

export const ChallanStatus = {
  DRAFT: 'DRAFT' as const,
  CONFIRMED: 'CONFIRMED' as const,
  CANCELLED: 'CANCELLED' as const,
};
