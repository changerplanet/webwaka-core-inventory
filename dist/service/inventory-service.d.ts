import { type InventoryItem, type StockLevel, type InventoryReservation, type InventoryAdjustment, type CreateItemInput, type ReserveStockInput, type AdjustStockInput, type ListItemsFilter, type Availability } from '../models/types';
import type { InventoryStorage, StockStorage, ReservationStorage, AdjustmentStorage } from '../storage/interfaces';
export interface InventoryServiceConfig {
    inventoryStorage: InventoryStorage;
    stockStorage: StockStorage;
    reservationStorage: ReservationStorage;
    adjustmentStorage: AdjustmentStorage;
    defaultReservationTtlMs?: number;
}
export declare class InventoryService {
    private readonly inventoryStorage;
    private readonly stockStorage;
    private readonly reservationStorage;
    private readonly adjustmentStorage;
    private readonly defaultReservationTtlMs;
    constructor(config: InventoryServiceConfig);
    createItem(input: CreateItemInput): Promise<InventoryItem>;
    getItem(tenantId: string, inventoryItemId: string): Promise<InventoryItem>;
    listItems(tenantId: string, filter?: ListItemsFilter): Promise<InventoryItem[]>;
    getStockLevel(tenantId: string, inventoryItemId: string, locationId?: string | null): Promise<StockLevel>;
    listStockLevels(tenantId: string): Promise<StockLevel[]>;
    reserveStock(input: ReserveStockInput): Promise<InventoryReservation>;
    releaseReservation(tenantId: string, reservationId: string): Promise<void>;
    fulfillReservation(tenantId: string, reservationId: string): Promise<void>;
    adjustStock(input: AdjustStockInput): Promise<InventoryAdjustment>;
    getAvailability(tenantId: string, inventoryItemId: string, locationId?: string | null): Promise<Availability>;
}
//# sourceMappingURL=inventory-service.d.ts.map