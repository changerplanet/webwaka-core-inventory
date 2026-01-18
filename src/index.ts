export interface Product {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockLevel {
  productId: string;
  tenantId: string;
  locationId?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  updatedAt: Date;
}

export interface InventoryAdjustment {
  id: string;
  tenantId: string;
  productId: string;
  quantity: number;
  reason: string;
  actorId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export interface Reservation {
  id: string;
  tenantId: string;
  productId: string;
  quantity: number;
  expiresAt: Date;
  createdAt: Date;
}

export interface InventoryCore {
  getProduct(tenantId: string, productId: string): Promise<Product | null>;
  listProducts(tenantId: string, filters?: Record<string, unknown>): Promise<Product[]>;
  getStockLevel(tenantId: string, productId: string, locationId?: string): Promise<StockLevel | null>;
  adjustStock(tenantId: string, productId: string, quantity: number, reason: string, actorId: string): Promise<InventoryAdjustment>;
  reserveStock(tenantId: string, productId: string, quantity: number, reservationId: string): Promise<Reservation>;
  releaseReservation(tenantId: string, reservationId: string): Promise<void>;
}

export const VERSION = '0.1.0';
