"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryAdjustmentStorage = exports.InMemoryReservationStorage = exports.InMemoryStockStorage = exports.InMemoryInventoryStorage = void 0;
class InMemoryInventoryStorage {
    items = new Map();
    key(tenantId, inventoryItemId) {
        return `${tenantId}:${inventoryItemId}`;
    }
    async create(item) {
        this.items.set(this.key(item.tenantId, item.inventoryItemId), item);
        return item;
    }
    async get(tenantId, inventoryItemId) {
        return this.items.get(this.key(tenantId, inventoryItemId)) ?? null;
    }
    async list(tenantId, filter) {
        const results = [];
        for (const item of this.items.values()) {
            if (item.tenantId !== tenantId)
                continue;
            if (filter?.sku && !item.sku.includes(filter.sku))
                continue;
            if (filter?.name && !item.name.toLowerCase().includes(filter.name.toLowerCase()))
                continue;
            results.push(item);
        }
        return results;
    }
    async update(item) {
        this.items.set(this.key(item.tenantId, item.inventoryItemId), item);
        return item;
    }
    async delete(tenantId, inventoryItemId) {
        return this.items.delete(this.key(tenantId, inventoryItemId));
    }
    clear() {
        this.items.clear();
    }
}
exports.InMemoryInventoryStorage = InMemoryInventoryStorage;
class InMemoryStockStorage {
    stocks = new Map();
    key(tenantId, inventoryItemId, locationId) {
        return `${tenantId}:${inventoryItemId}:${locationId ?? 'default'}`;
    }
    async get(tenantId, inventoryItemId, locationId) {
        return this.stocks.get(this.key(tenantId, inventoryItemId, locationId)) ?? null;
    }
    async set(stockLevel) {
        this.stocks.set(this.key(stockLevel.tenantId, stockLevel.inventoryItemId, stockLevel.locationId), stockLevel);
        return stockLevel;
    }
    async list(tenantId) {
        const results = [];
        for (const stock of this.stocks.values()) {
            if (stock.tenantId === tenantId) {
                results.push(stock);
            }
        }
        return results;
    }
    async listByItem(tenantId, inventoryItemId) {
        const results = [];
        for (const stock of this.stocks.values()) {
            if (stock.tenantId === tenantId && stock.inventoryItemId === inventoryItemId) {
                results.push(stock);
            }
        }
        return results;
    }
    async delete(tenantId, inventoryItemId, locationId) {
        return this.stocks.delete(this.key(tenantId, inventoryItemId, locationId));
    }
    clear() {
        this.stocks.clear();
    }
}
exports.InMemoryStockStorage = InMemoryStockStorage;
class InMemoryReservationStorage {
    reservations = new Map();
    key(tenantId, reservationId) {
        return `${tenantId}:${reservationId}`;
    }
    async create(reservation) {
        this.reservations.set(this.key(reservation.tenantId, reservation.reservationId), reservation);
        return reservation;
    }
    async get(tenantId, reservationId) {
        return this.reservations.get(this.key(tenantId, reservationId)) ?? null;
    }
    async update(reservation) {
        this.reservations.set(this.key(reservation.tenantId, reservation.reservationId), reservation);
        return reservation;
    }
    async listByItem(tenantId, inventoryItemId, status) {
        const results = [];
        for (const reservation of this.reservations.values()) {
            if (reservation.tenantId !== tenantId)
                continue;
            if (reservation.inventoryItemId !== inventoryItemId)
                continue;
            if (status && reservation.status !== status)
                continue;
            results.push(reservation);
        }
        return results;
    }
    async listActive(tenantId) {
        const results = [];
        for (const reservation of this.reservations.values()) {
            if (reservation.tenantId === tenantId && reservation.status === 'active') {
                results.push(reservation);
            }
        }
        return results;
    }
    async delete(tenantId, reservationId) {
        return this.reservations.delete(this.key(tenantId, reservationId));
    }
    clear() {
        this.reservations.clear();
    }
}
exports.InMemoryReservationStorage = InMemoryReservationStorage;
class InMemoryAdjustmentStorage {
    adjustments = new Map();
    key(tenantId, adjustmentId) {
        return `${tenantId}:${adjustmentId}`;
    }
    async create(adjustment) {
        this.adjustments.set(this.key(adjustment.tenantId, adjustment.adjustmentId), adjustment);
        return adjustment;
    }
    async get(tenantId, adjustmentId) {
        return this.adjustments.get(this.key(tenantId, adjustmentId)) ?? null;
    }
    async listByItem(tenantId, inventoryItemId) {
        const results = [];
        for (const adjustment of this.adjustments.values()) {
            if (adjustment.tenantId === tenantId && adjustment.inventoryItemId === inventoryItemId) {
                results.push(adjustment);
            }
        }
        return results;
    }
    async list(tenantId) {
        const results = [];
        for (const adjustment of this.adjustments.values()) {
            if (adjustment.tenantId === tenantId) {
                results.push(adjustment);
            }
        }
        return results;
    }
    clear() {
        this.adjustments.clear();
    }
}
exports.InMemoryAdjustmentStorage = InMemoryAdjustmentStorage;
//# sourceMappingURL=memory.js.map