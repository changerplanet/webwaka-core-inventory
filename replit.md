# WebWaka Core Inventory

## Overview

This is a TypeScript library providing shared inventory management services for the WebWaka platform. It is a headless library (no UI) that provides a single source of truth for product stock levels across all WebWaka Suites.

## Project Status

Infrastructure ready, implementation pending. The module exports type definitions and interfaces for inventory management.

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

### Watch Mode

```bash
npm run dev
```

## Project Structure

```
src/
  index.ts      - Main exports (types and interfaces)
  index.test.ts - Unit tests
dist/           - Compiled output (git-ignored)
```

## Dependencies

- TypeScript ^5.0.0
- Vitest ^1.0.0 (testing)

## Key Interfaces

- `Product` - Product definition with SKU
- `StockLevel` - Current stock by product and location
- `InventoryAdjustment` - Record of stock changes
- `Reservation` - Temporary stock hold for pending transactions
- `InventoryCore` - Main service interface
