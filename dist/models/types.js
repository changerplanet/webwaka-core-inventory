"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = exports.InsufficientStockError = exports.TenantIsolationError = exports.InventoryError = exports.ListItemsFilterSchema = exports.AdjustStockInputSchema = exports.ReserveStockInputSchema = exports.CreateItemInputSchema = exports.InventoryAdjustmentSchema = exports.InventoryReservationSchema = exports.StockLevelSchema = exports.InventoryItemSchema = exports.ReservationStatus = exports.ReservationSource = void 0;
const zod_1 = require("zod");
exports.ReservationSource = zod_1.z.enum(['pos', 'svm', 'mvm', 'system']);
exports.ReservationStatus = zod_1.z.enum(['active', 'released', 'fulfilled']);
exports.InventoryItemSchema = zod_1.z.object({
    inventoryItemId: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().min(1),
    sku: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    unit: zod_1.z.string().min(1),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    createdAt: zod_1.z.date(),
});
exports.StockLevelSchema = zod_1.z.object({
    inventoryItemId: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().min(1),
    locationId: zod_1.z.string().nullable(),
    quantityOnHand: zod_1.z.number().int(),
    quantityReserved: zod_1.z.number().int().min(0),
    updatedAt: zod_1.z.date(),
});
exports.InventoryReservationSchema = zod_1.z.object({
    reservationId: zod_1.z.string().uuid(),
    inventoryItemId: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().min(1),
    quantity: zod_1.z.number().int().positive(),
    source: exports.ReservationSource,
    locationId: zod_1.z.string().nullable(),
    expiresAt: zod_1.z.date(),
    status: exports.ReservationStatus,
    createdAt: zod_1.z.date(),
});
exports.InventoryAdjustmentSchema = zod_1.z.object({
    adjustmentId: zod_1.z.string().uuid(),
    inventoryItemId: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().min(1),
    delta: zod_1.z.number().int(),
    reason: zod_1.z.string().min(1),
    actor: zod_1.z.string().min(1),
    timestamp: zod_1.z.date(),
});
exports.CreateItemInputSchema = zod_1.z.object({
    tenantId: zod_1.z.string().min(1),
    sku: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    unit: zod_1.z.string().min(1),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    initialQuantity: zod_1.z.number().int().min(0).optional(),
    locationId: zod_1.z.string().nullable().optional(),
});
exports.ReserveStockInputSchema = zod_1.z.object({
    tenantId: zod_1.z.string().min(1),
    inventoryItemId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().int().positive(),
    source: exports.ReservationSource,
    expiresAt: zod_1.z.date().optional(),
    locationId: zod_1.z.string().nullable().optional(),
});
exports.AdjustStockInputSchema = zod_1.z.object({
    tenantId: zod_1.z.string().min(1),
    inventoryItemId: zod_1.z.string().uuid(),
    delta: zod_1.z.number().int(),
    reason: zod_1.z.string().min(1),
    actor: zod_1.z.string().min(1),
    locationId: zod_1.z.string().nullable().optional(),
});
exports.ListItemsFilterSchema = zod_1.z.object({
    sku: zod_1.z.string().optional(),
    name: zod_1.z.string().optional(),
}).optional();
class InventoryError extends Error {
    code;
    tenantId;
    constructor(message, code, tenantId) {
        super(message);
        this.code = code;
        this.tenantId = tenantId;
        this.name = 'InventoryError';
    }
}
exports.InventoryError = InventoryError;
class TenantIsolationError extends InventoryError {
    constructor(message, tenantId) {
        super(message, 'TENANT_ISOLATION_VIOLATION', tenantId);
        this.name = 'TenantIsolationError';
    }
}
exports.TenantIsolationError = TenantIsolationError;
class InsufficientStockError extends InventoryError {
    constructor(inventoryItemId, requested, available, tenantId) {
        super(`Insufficient stock for item ${inventoryItemId}: requested ${requested}, available ${available}`, 'INSUFFICIENT_STOCK', tenantId);
        this.name = 'InsufficientStockError';
    }
}
exports.InsufficientStockError = InsufficientStockError;
class NotFoundError extends InventoryError {
    constructor(entity, id, tenantId) {
        super(`${entity} not found: ${id}`, 'NOT_FOUND', tenantId);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
//# sourceMappingURL=types.js.map