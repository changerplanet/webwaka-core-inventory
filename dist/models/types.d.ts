import { z } from 'zod';
export declare const ReservationSource: z.ZodEnum<{
    pos: "pos";
    svm: "svm";
    mvm: "mvm";
    system: "system";
}>;
export type ReservationSource = z.infer<typeof ReservationSource>;
export declare const ReservationStatus: z.ZodEnum<{
    active: "active";
    released: "released";
    fulfilled: "fulfilled";
}>;
export type ReservationStatus = z.infer<typeof ReservationStatus>;
export declare const InventoryItemSchema: z.ZodObject<{
    inventoryItemId: z.ZodString;
    tenantId: z.ZodString;
    sku: z.ZodString;
    name: z.ZodString;
    unit: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodDate;
}, z.core.$strip>;
export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export declare const StockLevelSchema: z.ZodObject<{
    inventoryItemId: z.ZodString;
    tenantId: z.ZodString;
    locationId: z.ZodNullable<z.ZodString>;
    quantityOnHand: z.ZodNumber;
    quantityReserved: z.ZodNumber;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export type StockLevel = z.infer<typeof StockLevelSchema>;
export declare const InventoryReservationSchema: z.ZodObject<{
    reservationId: z.ZodString;
    inventoryItemId: z.ZodString;
    tenantId: z.ZodString;
    quantity: z.ZodNumber;
    source: z.ZodEnum<{
        pos: "pos";
        svm: "svm";
        mvm: "mvm";
        system: "system";
    }>;
    locationId: z.ZodNullable<z.ZodString>;
    expiresAt: z.ZodDate;
    status: z.ZodEnum<{
        active: "active";
        released: "released";
        fulfilled: "fulfilled";
    }>;
    createdAt: z.ZodDate;
}, z.core.$strip>;
export type InventoryReservation = z.infer<typeof InventoryReservationSchema>;
export declare const InventoryAdjustmentSchema: z.ZodObject<{
    adjustmentId: z.ZodString;
    inventoryItemId: z.ZodString;
    tenantId: z.ZodString;
    delta: z.ZodNumber;
    reason: z.ZodString;
    actor: z.ZodString;
    timestamp: z.ZodDate;
}, z.core.$strip>;
export type InventoryAdjustment = z.infer<typeof InventoryAdjustmentSchema>;
export declare const CreateItemInputSchema: z.ZodObject<{
    tenantId: z.ZodString;
    sku: z.ZodString;
    name: z.ZodString;
    unit: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    initialQuantity: z.ZodOptional<z.ZodNumber>;
    locationId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export type CreateItemInput = z.infer<typeof CreateItemInputSchema>;
export declare const ReserveStockInputSchema: z.ZodObject<{
    tenantId: z.ZodString;
    inventoryItemId: z.ZodString;
    quantity: z.ZodNumber;
    source: z.ZodEnum<{
        pos: "pos";
        svm: "svm";
        mvm: "mvm";
        system: "system";
    }>;
    expiresAt: z.ZodOptional<z.ZodDate>;
    locationId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export type ReserveStockInput = z.infer<typeof ReserveStockInputSchema>;
export declare const AdjustStockInputSchema: z.ZodObject<{
    tenantId: z.ZodString;
    inventoryItemId: z.ZodString;
    delta: z.ZodNumber;
    reason: z.ZodString;
    actor: z.ZodString;
    locationId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export type AdjustStockInput = z.infer<typeof AdjustStockInputSchema>;
export declare const ListItemsFilterSchema: z.ZodOptional<z.ZodObject<{
    sku: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
export type ListItemsFilter = z.infer<typeof ListItemsFilterSchema>;
export interface Availability {
    inventoryItemId: string;
    tenantId: string;
    locationId: string | null;
    quantityOnHand: number;
    quantityReserved: number;
    quantityAvailable: number;
}
export declare class InventoryError extends Error {
    readonly code: string;
    readonly tenantId?: string | undefined;
    constructor(message: string, code: string, tenantId?: string | undefined);
}
export declare class TenantIsolationError extends InventoryError {
    constructor(message: string, tenantId?: string);
}
export declare class InsufficientStockError extends InventoryError {
    constructor(inventoryItemId: string, requested: number, available: number, tenantId?: string);
}
export declare class NotFoundError extends InventoryError {
    constructor(entity: string, id: string, tenantId?: string);
}
//# sourceMappingURL=types.d.ts.map