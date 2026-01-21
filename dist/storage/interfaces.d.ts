import type { InventoryItem, StockLevel, InventoryReservation, InventoryAdjustment, ListItemsFilter } from '../models/types';
export interface InventoryStorage {
    create(item: InventoryItem): Promise<InventoryItem>;
    get(tenantId: string, inventoryItemId: string): Promise<InventoryItem | null>;
    list(tenantId: string, filter?: ListItemsFilter): Promise<InventoryItem[]>;
    update(item: InventoryItem): Promise<InventoryItem>;
    delete(tenantId: string, inventoryItemId: string): Promise<boolean>;
}
export interface StockStorage {
    get(tenantId: string, inventoryItemId: string, locationId: string | null): Promise<StockLevel | null>;
    set(stockLevel: StockLevel): Promise<StockLevel>;
    list(tenantId: string): Promise<StockLevel[]>;
    listByItem(tenantId: string, inventoryItemId: string): Promise<StockLevel[]>;
    delete(tenantId: string, inventoryItemId: string, locationId: string | null): Promise<boolean>;
}
export interface ReservationStorage {
    create(reservation: InventoryReservation): Promise<InventoryReservation>;
    get(tenantId: string, reservationId: string): Promise<InventoryReservation | null>;
    update(reservation: InventoryReservation): Promise<InventoryReservation>;
    listByItem(tenantId: string, inventoryItemId: string, status?: InventoryReservation['status']): Promise<InventoryReservation[]>;
    listActive(tenantId: string): Promise<InventoryReservation[]>;
    delete(tenantId: string, reservationId: string): Promise<boolean>;
}
export interface AdjustmentStorage {
    create(adjustment: InventoryAdjustment): Promise<InventoryAdjustment>;
    get(tenantId: string, adjustmentId: string): Promise<InventoryAdjustment | null>;
    listByItem(tenantId: string, inventoryItemId: string): Promise<InventoryAdjustment[]>;
    list(tenantId: string): Promise<InventoryAdjustment[]>;
}
//# sourceMappingURL=interfaces.d.ts.map