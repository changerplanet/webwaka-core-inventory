import { v4 as uuidv4 } from 'uuid';
import {
  type InventoryItem,
  type StockLevel,
  type InventoryReservation,
  type InventoryAdjustment,
  type CreateItemInput,
  type ReserveStockInput,
  type AdjustStockInput,
  type ListItemsFilter,
  type Availability,
  CreateItemInputSchema,
  ReserveStockInputSchema,
  AdjustStockInputSchema,
  InventoryError,
  TenantIsolationError,
  InsufficientStockError,
  NotFoundError,
} from '../models/types';
import type {
  InventoryStorage,
  StockStorage,
  ReservationStorage,
  AdjustmentStorage,
} from '../storage/interfaces';

export interface InventoryServiceConfig {
  inventoryStorage: InventoryStorage;
  stockStorage: StockStorage;
  reservationStorage: ReservationStorage;
  adjustmentStorage: AdjustmentStorage;
  defaultReservationTtlMs?: number;
}

export class InventoryService {
  private readonly inventoryStorage: InventoryStorage;
  private readonly stockStorage: StockStorage;
  private readonly reservationStorage: ReservationStorage;
  private readonly adjustmentStorage: AdjustmentStorage;
  private readonly defaultReservationTtlMs: number;

  constructor(config: InventoryServiceConfig) {
    this.inventoryStorage = config.inventoryStorage;
    this.stockStorage = config.stockStorage;
    this.reservationStorage = config.reservationStorage;
    this.adjustmentStorage = config.adjustmentStorage;
    this.defaultReservationTtlMs = config.defaultReservationTtlMs ?? 15 * 60 * 1000;
  }

  async createItem(input: CreateItemInput): Promise<InventoryItem> {
    const validated = CreateItemInputSchema.parse(input);
    const now = new Date();

    const item: InventoryItem = {
      inventoryItemId: uuidv4(),
      tenantId: validated.tenantId,
      sku: validated.sku,
      name: validated.name,
      unit: validated.unit,
      metadata: validated.metadata,
      createdAt: now,
    };

    await this.inventoryStorage.create(item);

    const locationId = validated.locationId ?? null;
    const stockLevel: StockLevel = {
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

  async getItem(tenantId: string, inventoryItemId: string): Promise<InventoryItem> {
    if (!tenantId) {
      throw new TenantIsolationError('tenantId is required');
    }

    const item = await this.inventoryStorage.get(tenantId, inventoryItemId);
    if (!item) {
      throw new NotFoundError('InventoryItem', inventoryItemId, tenantId);
    }

    if (item.tenantId !== tenantId) {
      throw new TenantIsolationError('Cross-tenant access denied', tenantId);
    }

    return item;
  }

  async listItems(tenantId: string, filter?: ListItemsFilter): Promise<InventoryItem[]> {
    if (!tenantId) {
      throw new TenantIsolationError('tenantId is required');
    }

    return this.inventoryStorage.list(tenantId, filter);
  }

  async getStockLevel(
    tenantId: string,
    inventoryItemId: string,
    locationId?: string | null
  ): Promise<StockLevel> {
    if (!tenantId) {
      throw new TenantIsolationError('tenantId is required');
    }

    const loc = locationId ?? null;
    const stockLevel = await this.stockStorage.get(tenantId, inventoryItemId, loc);

    if (!stockLevel) {
      throw new NotFoundError('StockLevel', `${inventoryItemId}:${loc}`, tenantId);
    }

    if (stockLevel.tenantId !== tenantId) {
      throw new TenantIsolationError('Cross-tenant access denied', tenantId);
    }

    return stockLevel;
  }

  async listStockLevels(tenantId: string): Promise<StockLevel[]> {
    if (!tenantId) {
      throw new TenantIsolationError('tenantId is required');
    }

    return this.stockStorage.list(tenantId);
  }

  async reserveStock(input: ReserveStockInput): Promise<InventoryReservation> {
    const validated = ReserveStockInputSchema.parse(input);

    await this.getItem(validated.tenantId, validated.inventoryItemId);

    const locationId = validated.locationId ?? null;
    const stockLevel = await this.stockStorage.get(
      validated.tenantId,
      validated.inventoryItemId,
      locationId
    );

    if (!stockLevel) {
      throw new NotFoundError(
        'StockLevel',
        `${validated.inventoryItemId}:${locationId}`,
        validated.tenantId
      );
    }

    const available = stockLevel.quantityOnHand - stockLevel.quantityReserved;
    if (validated.quantity > available) {
      throw new InsufficientStockError(
        validated.inventoryItemId,
        validated.quantity,
        available,
        validated.tenantId
      );
    }

    const now = new Date();
    const expiresAt = validated.expiresAt ?? new Date(now.getTime() + this.defaultReservationTtlMs);

    const reservation: InventoryReservation = {
      reservationId: uuidv4(),
      inventoryItemId: validated.inventoryItemId,
      tenantId: validated.tenantId,
      quantity: validated.quantity,
      source: validated.source,
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

  async releaseReservation(tenantId: string, reservationId: string): Promise<void> {
    if (!tenantId) {
      throw new TenantIsolationError('tenantId is required');
    }

    const reservation = await this.reservationStorage.get(tenantId, reservationId);
    if (!reservation) {
      throw new NotFoundError('Reservation', reservationId, tenantId);
    }

    if (reservation.tenantId !== tenantId) {
      throw new TenantIsolationError('Cross-tenant access denied', tenantId);
    }

    if (reservation.status !== 'active') {
      throw new InventoryError(
        `Cannot release reservation with status: ${reservation.status}`,
        'INVALID_RESERVATION_STATUS',
        tenantId
      );
    }

    const stockLevel = await this.stockStorage.get(
      tenantId,
      reservation.inventoryItemId,
      null
    );

    if (stockLevel) {
      stockLevel.quantityReserved = Math.max(0, stockLevel.quantityReserved - reservation.quantity);
      stockLevel.updatedAt = new Date();
      await this.stockStorage.set(stockLevel);
    }

    reservation.status = 'released';
    await this.reservationStorage.update(reservation);
  }

  async fulfillReservation(tenantId: string, reservationId: string): Promise<void> {
    if (!tenantId) {
      throw new TenantIsolationError('tenantId is required');
    }

    const reservation = await this.reservationStorage.get(tenantId, reservationId);
    if (!reservation) {
      throw new NotFoundError('Reservation', reservationId, tenantId);
    }

    if (reservation.tenantId !== tenantId) {
      throw new TenantIsolationError('Cross-tenant access denied', tenantId);
    }

    if (reservation.status !== 'active') {
      throw new InventoryError(
        `Cannot fulfill reservation with status: ${reservation.status}`,
        'INVALID_RESERVATION_STATUS',
        tenantId
      );
    }

    const stockLevel = await this.stockStorage.get(
      tenantId,
      reservation.inventoryItemId,
      null
    );

    if (stockLevel) {
      stockLevel.quantityOnHand -= reservation.quantity;
      stockLevel.quantityReserved = Math.max(0, stockLevel.quantityReserved - reservation.quantity);
      stockLevel.updatedAt = new Date();
      await this.stockStorage.set(stockLevel);
    }

    reservation.status = 'fulfilled';
    await this.reservationStorage.update(reservation);
  }

  async adjustStock(input: AdjustStockInput): Promise<InventoryAdjustment> {
    const validated = AdjustStockInputSchema.parse(input);

    await this.getItem(validated.tenantId, validated.inventoryItemId);

    const locationId = validated.locationId ?? null;
    let stockLevel = await this.stockStorage.get(
      validated.tenantId,
      validated.inventoryItemId,
      locationId
    );

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

    const adjustment: InventoryAdjustment = {
      adjustmentId: uuidv4(),
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

  async getAvailability(
    tenantId: string,
    inventoryItemId: string,
    locationId?: string | null
  ): Promise<Availability> {
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
