# WebWaka Core Inventory

## Overview

This is a TypeScript library providing shared inventory management services for the WebWaka platform. It is a headless library (no UI) that provides a single source of truth for product stock levels across all WebWaka Suites (POS, SVM, MVM).

## Project Status

Implemented. All core functionality complete with 87% test coverage.

## Architecture

- **Classification:** Core Module
- **Type:** Headless TypeScript library
- **Consumers:** POS, SVM, MVM, and other Suites

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Test with Coverage

```bash
npm test -- --coverage
```

### Watch Mode

```bash
npm run dev
```

## Project Structure

```
src/
  index.ts                  - Main exports
  inventory.test.ts         - Comprehensive unit tests
  models/
    types.ts                - Domain models with Zod schemas
  storage/
    interfaces.ts           - Storage interface definitions
    memory.ts               - In-memory implementations for testing
  service/
    inventory-service.ts    - Main InventoryService implementation
dist/                       - Compiled output (git-ignored)
```

## Dependencies

- TypeScript ^5.0.0
- Vitest ^1.0.0 (testing)
- Zod (validation)
- UUID (identifier generation)

## Key Exports

### Domain Models
- `InventoryItem` - Product definition with SKU
- `StockLevel` - Current stock by product and location
- `InventoryAdjustment` - Record of stock changes with audit trail
- `InventoryReservation` - Temporary stock hold for pending transactions
- `Availability` - Computed availability (on-hand minus reserved)

### Service
- `InventoryService` - Main service providing all inventory operations

### Storage Interfaces
- `InventoryStorage` - Item CRUD operations
- `StockStorage` - Stock level management
- `ReservationStorage` - Reservation lifecycle
- `AdjustmentStorage` - Adjustment audit log

### In-Memory Implementations (for testing)
- `InMemoryInventoryStorage`
- `InMemoryStockStorage`
- `InMemoryReservationStorage`
- `InMemoryAdjustmentStorage`

## Capabilities

- `inventory:create-item`
- `inventory:adjust-stock`
- `inventory:reserve-stock`
- `inventory:release-reservation`
- `inventory:fulfill-reservation`
- `inventory:query-availability`
