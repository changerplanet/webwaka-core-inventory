import type {
  InventoryItem,
  StockLevel,
  InventoryReservation,
  InventoryAdjustment,
  ListItemsFilter,
} from '../models/types';
import type {
  InventoryStorage,
  StockStorage,
  ReservationStorage,
  AdjustmentStorage,
} from './interfaces';

export class InMemoryInventoryStorage implements InventoryStorage {
  private items: Map<string, InventoryItem> = new Map();

  private key(tenantId: string, inventoryItemId: string): string {
    return `${tenantId}:${inventoryItemId}`;
  }

  async create(item: InventoryItem): Promise<InventoryItem> {
    this.items.set(this.key(item.tenantId, item.inventoryItemId), item);
    return item;
  }

  async get(tenantId: string, inventoryItemId: string): Promise<InventoryItem | null> {
    return this.items.get(this.key(tenantId, inventoryItemId)) ?? null;
  }

  async list(tenantId: string, filter?: ListItemsFilter): Promise<InventoryItem[]> {
    const results: InventoryItem[] = [];
    for (const item of this.items.values()) {
      if (item.tenantId !== tenantId) continue;
      if (filter?.sku && !item.sku.includes(filter.sku)) continue;
      if (filter?.name && !item.name.toLowerCase().includes(filter.name.toLowerCase())) continue;
      results.push(item);
    }
    return results;
  }

  async update(item: InventoryItem): Promise<InventoryItem> {
    this.items.set(this.key(item.tenantId, item.inventoryItemId), item);
    return item;
  }

  async delete(tenantId: string, inventoryItemId: string): Promise<boolean> {
    return this.items.delete(this.key(tenantId, inventoryItemId));
  }

  clear(): void {
    this.items.clear();
  }
}

export class InMemoryStockStorage implements StockStorage {
  private stocks: Map<string, StockLevel> = new Map();

  private key(tenantId: string, inventoryItemId: string, locationId: string | null): string {
    return `${tenantId}:${inventoryItemId}:${locationId ?? 'default'}`;
  }

  async get(
    tenantId: string,
    inventoryItemId: string,
    locationId: string | null
  ): Promise<StockLevel | null> {
    return this.stocks.get(this.key(tenantId, inventoryItemId, locationId)) ?? null;
  }

  async set(stockLevel: StockLevel): Promise<StockLevel> {
    this.stocks.set(
      this.key(stockLevel.tenantId, stockLevel.inventoryItemId, stockLevel.locationId),
      stockLevel
    );
    return stockLevel;
  }

  async list(tenantId: string): Promise<StockLevel[]> {
    const results: StockLevel[] = [];
    for (const stock of this.stocks.values()) {
      if (stock.tenantId === tenantId) {
        results.push(stock);
      }
    }
    return results;
  }

  async listByItem(tenantId: string, inventoryItemId: string): Promise<StockLevel[]> {
    const results: StockLevel[] = [];
    for (const stock of this.stocks.values()) {
      if (stock.tenantId === tenantId && stock.inventoryItemId === inventoryItemId) {
        results.push(stock);
      }
    }
    return results;
  }

  async delete(
    tenantId: string,
    inventoryItemId: string,
    locationId: string | null
  ): Promise<boolean> {
    return this.stocks.delete(this.key(tenantId, inventoryItemId, locationId));
  }

  clear(): void {
    this.stocks.clear();
  }
}

export class InMemoryReservationStorage implements ReservationStorage {
  private reservations: Map<string, InventoryReservation> = new Map();

  private key(tenantId: string, reservationId: string): string {
    return `${tenantId}:${reservationId}`;
  }

  async create(reservation: InventoryReservation): Promise<InventoryReservation> {
    this.reservations.set(this.key(reservation.tenantId, reservation.reservationId), reservation);
    return reservation;
  }

  async get(tenantId: string, reservationId: string): Promise<InventoryReservation | null> {
    return this.reservations.get(this.key(tenantId, reservationId)) ?? null;
  }

  async update(reservation: InventoryReservation): Promise<InventoryReservation> {
    this.reservations.set(this.key(reservation.tenantId, reservation.reservationId), reservation);
    return reservation;
  }

  async listByItem(
    tenantId: string,
    inventoryItemId: string,
    status?: InventoryReservation['status']
  ): Promise<InventoryReservation[]> {
    const results: InventoryReservation[] = [];
    for (const reservation of this.reservations.values()) {
      if (reservation.tenantId !== tenantId) continue;
      if (reservation.inventoryItemId !== inventoryItemId) continue;
      if (status && reservation.status !== status) continue;
      results.push(reservation);
    }
    return results;
  }

  async listActive(tenantId: string): Promise<InventoryReservation[]> {
    const results: InventoryReservation[] = [];
    for (const reservation of this.reservations.values()) {
      if (reservation.tenantId === tenantId && reservation.status === 'active') {
        results.push(reservation);
      }
    }
    return results;
  }

  async delete(tenantId: string, reservationId: string): Promise<boolean> {
    return this.reservations.delete(this.key(tenantId, reservationId));
  }

  clear(): void {
    this.reservations.clear();
  }
}

export class InMemoryAdjustmentStorage implements AdjustmentStorage {
  private adjustments: Map<string, InventoryAdjustment> = new Map();

  private key(tenantId: string, adjustmentId: string): string {
    return `${tenantId}:${adjustmentId}`;
  }

  async create(adjustment: InventoryAdjustment): Promise<InventoryAdjustment> {
    this.adjustments.set(this.key(adjustment.tenantId, adjustment.adjustmentId), adjustment);
    return adjustment;
  }

  async get(tenantId: string, adjustmentId: string): Promise<InventoryAdjustment | null> {
    return this.adjustments.get(this.key(tenantId, adjustmentId)) ?? null;
  }

  async listByItem(tenantId: string, inventoryItemId: string): Promise<InventoryAdjustment[]> {
    const results: InventoryAdjustment[] = [];
    for (const adjustment of this.adjustments.values()) {
      if (adjustment.tenantId === tenantId && adjustment.inventoryItemId === inventoryItemId) {
        results.push(adjustment);
      }
    }
    return results;
  }

  async list(tenantId: string): Promise<InventoryAdjustment[]> {
    const results: InventoryAdjustment[] = [];
    for (const adjustment of this.adjustments.values()) {
      if (adjustment.tenantId === tenantId) {
        results.push(adjustment);
      }
    }
    return results;
  }

  clear(): void {
    this.adjustments.clear();
  }
}
