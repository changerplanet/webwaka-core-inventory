import { z } from 'zod';

export const ReservationSource = z.enum(['pos', 'svm', 'mvm', 'system']);
export type ReservationSource = z.infer<typeof ReservationSource>;

export const ReservationStatus = z.enum(['active', 'released', 'fulfilled']);
export type ReservationStatus = z.infer<typeof ReservationStatus>;

export const InventoryItemSchema = z.object({
  inventoryItemId: z.string().uuid(),
  tenantId: z.string().min(1),
  sku: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.date(),
});
export type InventoryItem = z.infer<typeof InventoryItemSchema>;

export const StockLevelSchema = z.object({
  inventoryItemId: z.string().uuid(),
  tenantId: z.string().min(1),
  locationId: z.string().nullable(),
  quantityOnHand: z.number().int(),
  quantityReserved: z.number().int().min(0),
  updatedAt: z.date(),
});
export type StockLevel = z.infer<typeof StockLevelSchema>;

export const InventoryReservationSchema = z.object({
  reservationId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  tenantId: z.string().min(1),
  quantity: z.number().int().positive(),
  source: ReservationSource,
  expiresAt: z.date(),
  status: ReservationStatus,
  createdAt: z.date(),
});
export type InventoryReservation = z.infer<typeof InventoryReservationSchema>;

export const InventoryAdjustmentSchema = z.object({
  adjustmentId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  tenantId: z.string().min(1),
  delta: z.number().int(),
  reason: z.string().min(1),
  actor: z.string().min(1),
  timestamp: z.date(),
});
export type InventoryAdjustment = z.infer<typeof InventoryAdjustmentSchema>;

export const CreateItemInputSchema = z.object({
  tenantId: z.string().min(1),
  sku: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  initialQuantity: z.number().int().min(0).optional(),
  locationId: z.string().nullable().optional(),
});
export type CreateItemInput = z.infer<typeof CreateItemInputSchema>;

export const ReserveStockInputSchema = z.object({
  tenantId: z.string().min(1),
  inventoryItemId: z.string().uuid(),
  quantity: z.number().int().positive(),
  source: ReservationSource,
  expiresAt: z.date().optional(),
  locationId: z.string().nullable().optional(),
});
export type ReserveStockInput = z.infer<typeof ReserveStockInputSchema>;

export const AdjustStockInputSchema = z.object({
  tenantId: z.string().min(1),
  inventoryItemId: z.string().uuid(),
  delta: z.number().int(),
  reason: z.string().min(1),
  actor: z.string().min(1),
  locationId: z.string().nullable().optional(),
});
export type AdjustStockInput = z.infer<typeof AdjustStockInputSchema>;

export const ListItemsFilterSchema = z.object({
  sku: z.string().optional(),
  name: z.string().optional(),
}).optional();
export type ListItemsFilter = z.infer<typeof ListItemsFilterSchema>;

export interface Availability {
  inventoryItemId: string;
  tenantId: string;
  locationId: string | null;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
}

export class InventoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly tenantId?: string
  ) {
    super(message);
    this.name = 'InventoryError';
  }
}

export class TenantIsolationError extends InventoryError {
  constructor(message: string, tenantId?: string) {
    super(message, 'TENANT_ISOLATION_VIOLATION', tenantId);
    this.name = 'TenantIsolationError';
  }
}

export class InsufficientStockError extends InventoryError {
  constructor(
    inventoryItemId: string,
    requested: number,
    available: number,
    tenantId?: string
  ) {
    super(
      `Insufficient stock for item ${inventoryItemId}: requested ${requested}, available ${available}`,
      'INSUFFICIENT_STOCK',
      tenantId
    );
    this.name = 'InsufficientStockError';
  }
}

export class NotFoundError extends InventoryError {
  constructor(entity: string, id: string, tenantId?: string) {
    super(`${entity} not found: ${id}`, 'NOT_FOUND', tenantId);
    this.name = 'NotFoundError';
  }
}
