# Module Contract: webwaka-core-inventory

**Version:** 0.1.0  
**Classification:** Core  
**Status:** Implemented

---

## Purpose

The Inventory Core provides a single source of truth for product inventory across all WebWaka Suites. It ensures consistent stock tracking, prevents overselling, enables multi-channel synchronization, and supports offline-first applications with reconciliation hooks.

---

## Scope

### In Scope

- Inventory item management (create, read, list)
- Stock level tracking (real-time)
- Stock reservations for pending transactions
- Reservation release and fulfillment
- Stock adjustments with audit trail
- Availability queries
- Tenant-aware inventory isolation

### Out of Scope

- Pricing logic (belongs in Suite or separate pricing core)
- Product catalog UI (belongs in Suites)
- Warehouse management (future extension)
- Supplier management (future extension)
- Reporting and analytics UI (belongs in Suites)

---

## Capabilities

The module provides the following capabilities:

- `inventory:create-item` - Create inventory items
- `inventory:adjust-stock` - Modify stock levels with reason tracking
- `inventory:reserve-stock` - Reserve stock for pending transactions
- `inventory:release-reservation` - Release reserved stock back to available pool
- `inventory:fulfill-reservation` - Permanently reduce stock for fulfilled orders
- `inventory:query-availability` - Query available stock (on-hand minus reserved)

---

## Dependencies

### Required

- **webwaka-core-registry** (^0.1.0) - Module registration and capability resolution

### Runtime Dependencies

- **zod** - Schema validation
- **uuid** - Unique identifier generation

### Optional

None at this time. Future dependencies may include audit or identity cores.

---

## Public API

### InventoryService

The primary service interface providing all inventory operations.

#### Item Management

```typescript
createItem(input: CreateItemInput): Promise<InventoryItem>
getItem(tenantId: string, inventoryItemId: string): Promise<InventoryItem>
listItems(tenantId: string, filter?: ListItemsFilter): Promise<InventoryItem[]>
```

#### Stock Operations

```typescript
getStockLevel(tenantId: string, inventoryItemId: string, locationId?: string): Promise<StockLevel>
listStockLevels(tenantId: string): Promise<StockLevel[]>
adjustStock(input: AdjustStockInput): Promise<InventoryAdjustment>
```

#### Reservations

```typescript
reserveStock(input: ReserveStockInput): Promise<InventoryReservation>
releaseReservation(tenantId: string, reservationId: string): Promise<void>
fulfillReservation(tenantId: string, reservationId: string): Promise<void>
```

#### Availability

```typescript
getAvailability(tenantId: string, inventoryItemId: string, locationId?: string): Promise<Availability>
```

---

## Data Model

### InventoryItem

```typescript
{
  inventoryItemId: string (UUID)
  tenantId: string
  sku: string
  name: string
  unit: string
  metadata?: Record<string, unknown>
  createdAt: Date
}
```

### StockLevel

```typescript
{
  inventoryItemId: string (UUID)
  tenantId: string
  locationId: string | null
  quantityOnHand: number
  quantityReserved: number
  updatedAt: Date
}
```

### InventoryReservation

```typescript
{
  reservationId: string (UUID)
  inventoryItemId: string (UUID)
  tenantId: string
  quantity: number
  source: 'pos' | 'svm' | 'mvm' | 'system'
  locationId: string | null
  expiresAt: Date
  status: 'active' | 'released' | 'fulfilled'
  createdAt: Date
}
```

### InventoryAdjustment

```typescript
{
  adjustmentId: string (UUID)
  inventoryItemId: string (UUID)
  tenantId: string
  delta: number
  reason: string
  actor: string
  timestamp: Date
}
```

### Availability

```typescript
{
  inventoryItemId: string
  tenantId: string
  locationId: string | null
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number
}
```

---

## Storage Abstraction

The module defines storage interfaces that must be implemented by consuming applications:

- **InventoryStorage** - CRUD operations for inventory items
- **StockStorage** - Stock level management
- **ReservationStorage** - Reservation lifecycle management
- **AdjustmentStorage** - Adjustment audit log

In-memory implementations are provided for testing purposes only.

---

## Tenant Isolation

All inventory data is strictly isolated by `tenantId`. Cross-tenant queries are forbidden. All public methods require `tenantId` as the first parameter or within input objects.

Violations result in `TenantIsolationError`.

---

## Error Handling

The module provides typed error classes:

- `InventoryError` - Base error class
- `TenantIsolationError` - Cross-tenant access attempt
- `InsufficientStockError` - Reservation exceeds available stock
- `NotFoundError` - Entity not found

---

## Testing Requirements

All requirements are met:

- Unit tests for all business logic ✓
- Integration tests for storage layer ✓
- Tenant isolation tests ✓
- Concurrency tests (prevent race conditions on stock updates) ✓
- Multi-suite shared inventory tests ✓

### Hard Stop Condition (Verified)

A single tenant can manage inventory that is safely shared across POS, SVM, and MVM without double-selling or leakage.

Specifically proven:
- Stock reservation reduces availability ✓
- Releasing a reservation restores availability ✓
- Fulfilling a reservation permanently reduces stock ✓
- Two reservations cannot overbook stock ✓
- Cross-tenant access is rejected ✓

**Coverage:** 87% (exceeds 80% minimum)

---

## Deployment

This module is deployed as:

- **TypeScript library** - Consumable via npm or monorepo workspace
- **No runtime service** - Embedded in Suite applications
- **No UI** - Headless business logic only

---

## Versioning

This module follows semantic versioning (semver). Breaking changes require a major version bump.

---

## Contact

For questions or contributions, see OWNERS.md
