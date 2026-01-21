"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const uuid_1 = require("uuid");
const types_1 = require("../models/types");
class InventoryService {
    inventoryStorage;
    stockStorage;
    reservationStorage;
    adjustmentStorage;
    defaultReservationTtlMs;
    constructor(config) {
        this.inventoryStorage = config.inventoryStorage;
        this.stockStorage = config.stockStorage;
        this.reservationStorage = config.reservationStorage;
        this.adjustmentStorage = config.adjustmentStorage;
        this.defaultReservationTtlMs = config.defaultReservationTtlMs ?? 15 * 60 * 1000;
    }
    async createItem(input) {
        const validated = types_1.CreateItemInputSchema.parse(input);
        const now = new Date();
        const item = {
            inventoryItemId: (0, uuid_1.v4)(),
            tenantId: validated.tenantId,
            sku: validated.sku,
            name: validated.name,
            unit: validated.unit,
            metadata: validated.metadata,
            createdAt: now,
        };
        await this.inventoryStorage.create(item);
        const locationId = validated.locationId ?? null;
        const stockLevel = {
            inventoryItemId: item.inventoryItemId,
            tenantId: validated.tenantId,
            locationId,
            quantityOnHand: validated.initialQuantity ?? 0,
            quantityReserved: 0,
            updatedAt: now,
        };
        await this.stockStorage.set(stockLevel);
        return item;
    }
    async getItem(tenantId, inventoryItemId) {
        if (!tenantId) {
            throw new types_1.TenantIsolationError('tenantId is required');
        }
        const item = await this.inventoryStorage.get(tenantId, inventoryItemId);
        if (!item) {
            throw new types_1.NotFoundError('InventoryItem', inventoryItemId, tenantId);
        }
        if (item.tenantId !== tenantId) {
            throw new types_1.TenantIsolationError('Cross-tenant access denied', tenantId);
        }
        return item;
    }
    async listItems(tenantId, filter) {
        if (!tenantId) {
            throw new types_1.TenantIsolationError('tenantId is required');
        }
        return this.inventoryStorage.list(tenantId, filter);
    }
    async getStockLevel(tenantId, inventoryItemId, locationId) {
        if (!tenantId) {
            throw new types_1.TenantIsolationError('tenantId is required');
        }
        const loc = locationId ?? null;
        const stockLevel = await this.stockStorage.get(tenantId, inventoryItemId, loc);
        if (!stockLevel) {
            throw new types_1.NotFoundError('StockLevel', `${inventoryItemId}:${loc}`, tenantId);
        }
        if (stockLevel.tenantId !== tenantId) {
            throw new types_1.TenantIsolationError('Cross-tenant access denied', tenantId);
        }
        return stockLevel;
    }
    async listStockLevels(tenantId) {
        if (!tenantId) {
            throw new types_1.TenantIsolationError('tenantId is required');
        }
        return this.stockStorage.list(tenantId);
    }
    async reserveStock(input) {
        const validated = types_1.ReserveStockInputSchema.parse(input);
        await this.getItem(validated.tenantId, validated.inventoryItemId);
        const locationId = validated.locationId ?? null;
        const stockLevel = await this.stockStorage.get(validated.tenantId, validated.inventoryItemId, locationId);
        if (!stockLevel) {
            throw new types_1.NotFoundError('StockLevel', `${validated.inventoryItemId}:${locationId}`, validated.tenantId);
        }
        const available = stockLevel.quantityOnHand - stockLevel.quantityReserved;
        if (validated.quantity > available) {
            throw new types_1.InsufficientStockError(validated.inventoryItemId, validated.quantity, available, validated.tenantId);
        }
        const now = new Date();
        const expiresAt = validated.expiresAt ?? new Date(now.getTime() + this.defaultReservationTtlMs);
        const reservation = {
            reservationId: (0, uuid_1.v4)(),
            inventoryItemId: validated.inventoryItemId,
            tenantId: validated.tenantId,
            quantity: validated.quantity,
            source: validated.source,
            locationId,
            expiresAt,
            status: 'active',
            createdAt: now,
        };
        stockLevel.quantityReserved += validated.quantity;
        stockLevel.updatedAt = now;
        await this.stockStorage.set(stockLevel);
        await this.reservationStorage.create(reservation);
        return reservation;
    }
    async releaseReservation(tenantId, reservationId) {
        if (!tenantId) {
            throw new types_1.TenantIsolationError('tenantId is required');
        }
        const reservation = await this.reservationStorage.get(tenantId, reservationId);
        if (!reservation) {
            throw new types_1.NotFoundError('Reservation', reservationId, tenantId);
        }
        if (reservation.tenantId !== tenantId) {
            throw new types_1.TenantIsolationError('Cross-tenant access denied', tenantId);
        }
        if (reservation.status !== 'active') {
            throw new types_1.InventoryError(`Cannot release reservation with status: ${reservation.status}`, 'INVALID_RESERVATION_STATUS', tenantId);
        }
        const stockLevel = await this.stockStorage.get(tenantId, reservation.inventoryItemId, reservation.locationId);
        if (stockLevel) {
            stockLevel.quantityReserved = Math.max(0, stockLevel.quantityReserved - reservation.quantity);
            stockLevel.updatedAt = new Date();
            await this.stockStorage.set(stockLevel);
        }
        reservation.status = 'released';
        await this.reservationStorage.update(reservation);
    }
    async fulfillReservation(tenantId, reservationId) {
        if (!tenantId) {
            throw new types_1.TenantIsolationError('tenantId is required');
        }
        const reservation = await this.reservationStorage.get(tenantId, reservationId);
        if (!reservation) {
            throw new types_1.NotFoundError('Reservation', reservationId, tenantId);
        }
        if (reservation.tenantId !== tenantId) {
            throw new types_1.TenantIsolationError('Cross-tenant access denied', tenantId);
        }
        if (reservation.status !== 'active') {
            throw new types_1.InventoryError(`Cannot fulfill reservation with status: ${reservation.status}`, 'INVALID_RESERVATION_STATUS', tenantId);
        }
        const stockLevel = await this.stockStorage.get(tenantId, reservation.inventoryItemId, reservation.locationId);
        if (stockLevel) {
            stockLevel.quantityOnHand -= reservation.quantity;
            stockLevel.quantityReserved = Math.max(0, stockLevel.quantityReserved - reservation.quantity);
            stockLevel.updatedAt = new Date();
            await this.stockStorage.set(stockLevel);
        }
        reservation.status = 'fulfilled';
        await this.reservationStorage.update(reservation);
    }
    async adjustStock(input) {
        const validated = types_1.AdjustStockInputSchema.parse(input);
        await this.getItem(validated.tenantId, validated.inventoryItemId);
        const locationId = validated.locationId ?? null;
        let stockLevel = await this.stockStorage.get(validated.tenantId, validated.inventoryItemId, locationId);
        const now = new Date();
        if (!stockLevel) {
            stockLevel = {
                inventoryItemId: validated.inventoryItemId,
                tenantId: validated.tenantId,
                locationId,
                quantityOnHand: 0,
                quantityReserved: 0,
                updatedAt: now,
            };
        }
        stockLevel.quantityOnHand += validated.delta;
        stockLevel.updatedAt = now;
        await this.stockStorage.set(stockLevel);
        const adjustment = {
            adjustmentId: (0, uuid_1.v4)(),
            inventoryItemId: validated.inventoryItemId,
            tenantId: validated.tenantId,
            delta: validated.delta,
            reason: validated.reason,
            actor: validated.actor,
            timestamp: now,
        };
        await this.adjustmentStorage.create(adjustment);
        return adjustment;
    }
    async getAvailability(tenantId, inventoryItemId, locationId) {
        const stockLevel = await this.getStockLevel(tenantId, inventoryItemId, locationId);
        return {
            inventoryItemId: stockLevel.inventoryItemId,
            tenantId: stockLevel.tenantId,
            locationId: stockLevel.locationId,
            quantityOnHand: stockLevel.quantityOnHand,
            quantityReserved: stockLevel.quantityReserved,
            quantityAvailable: stockLevel.quantityOnHand - stockLevel.quantityReserved,
        };
    }
}
exports.InventoryService = InventoryService;
//# sourceMappingURL=inventory-service.js.map