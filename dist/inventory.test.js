"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_1 = require("./index");
(0, vitest_1.describe)('webwaka-core-inventory', () => {
    let service;
    let inventoryStorage;
    let stockStorage;
    let reservationStorage;
    let adjustmentStorage;
    (0, vitest_1.beforeEach)(() => {
        inventoryStorage = new index_1.InMemoryInventoryStorage();
        stockStorage = new index_1.InMemoryStockStorage();
        reservationStorage = new index_1.InMemoryReservationStorage();
        adjustmentStorage = new index_1.InMemoryAdjustmentStorage();
        service = new index_1.InventoryService({
            inventoryStorage,
            stockStorage,
            reservationStorage,
            adjustmentStorage,
        });
    });
    (0, vitest_1.it)('exports version', () => {
        (0, vitest_1.expect)(index_1.VERSION).toBe('0.1.0');
    });
    (0, vitest_1.describe)('Item Management', () => {
        (0, vitest_1.it)('creates an inventory item', async () => {
            const item = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget',
                unit: 'pcs',
                initialQuantity: 100,
            });
            (0, vitest_1.expect)(item.inventoryItemId).toBeDefined();
            (0, vitest_1.expect)(item.tenantId).toBe('tenant-1');
            (0, vitest_1.expect)(item.sku).toBe('SKU-001');
            (0, vitest_1.expect)(item.name).toBe('Widget');
        });
        (0, vitest_1.it)('retrieves an item by id', async () => {
            const created = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget',
                unit: 'pcs',
            });
            const retrieved = await service.getItem('tenant-1', created.inventoryItemId);
            (0, vitest_1.expect)(retrieved.inventoryItemId).toBe(created.inventoryItemId);
        });
        (0, vitest_1.it)('lists items for a tenant', async () => {
            await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget A',
                unit: 'pcs',
            });
            await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-002',
                name: 'Widget B',
                unit: 'pcs',
            });
            const items = await service.listItems('tenant-1');
            (0, vitest_1.expect)(items.length).toBe(2);
        });
        (0, vitest_1.it)('filters items by sku', async () => {
            await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget A',
                unit: 'pcs',
            });
            await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-002',
                name: 'Widget B',
                unit: 'pcs',
            });
            const items = await service.listItems('tenant-1', { sku: '001' });
            (0, vitest_1.expect)(items.length).toBe(1);
            (0, vitest_1.expect)(items[0].sku).toBe('SKU-001');
        });
    });
    (0, vitest_1.describe)('Stock Level Management', () => {
        (0, vitest_1.it)('creates stock level when item is created', async () => {
            const item = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget',
                unit: 'pcs',
                initialQuantity: 100,
            });
            const stock = await service.getStockLevel('tenant-1', item.inventoryItemId);
            (0, vitest_1.expect)(stock.quantityOnHand).toBe(100);
            (0, vitest_1.expect)(stock.quantityReserved).toBe(0);
        });
        (0, vitest_1.it)('lists all stock levels for tenant', async () => {
            await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget A',
                unit: 'pcs',
                initialQuantity: 50,
            });
            await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-002',
                name: 'Widget B',
                unit: 'pcs',
                initialQuantity: 75,
            });
            const stocks = await service.listStockLevels('tenant-1');
            (0, vitest_1.expect)(stocks.length).toBe(2);
        });
    });
    (0, vitest_1.describe)('Stock Reservations', () => {
        (0, vitest_1.it)('reserves stock and reduces availability', async () => {
            const item = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget',
                unit: 'pcs',
                initialQuantity: 100,
            });
            const reservation = await service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                quantity: 30,
                source: 'pos',
            });
            (0, vitest_1.expect)(reservation.status).toBe('active');
            (0, vitest_1.expect)(reservation.quantity).toBe(30);
            const availability = await service.getAvailability('tenant-1', item.inventoryItemId);
            (0, vitest_1.expect)(availability.quantityOnHand).toBe(100);
            (0, vitest_1.expect)(availability.quantityReserved).toBe(30);
            (0, vitest_1.expect)(availability.quantityAvailable).toBe(70);
        });
        (0, vitest_1.it)('releasing a reservation restores availability', async () => {
            const item = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget',
                unit: 'pcs',
                initialQuantity: 100,
            });
            const reservation = await service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                quantity: 30,
                source: 'svm',
            });
            await service.releaseReservation('tenant-1', reservation.reservationId);
            const availability = await service.getAvailability('tenant-1', item.inventoryItemId);
            (0, vitest_1.expect)(availability.quantityAvailable).toBe(100);
            (0, vitest_1.expect)(availability.quantityReserved).toBe(0);
        });
        (0, vitest_1.it)('fulfilling a reservation permanently reduces stock', async () => {
            const item = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget',
                unit: 'pcs',
                initialQuantity: 100,
            });
            const reservation = await service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                quantity: 30,
                source: 'mvm',
            });
            await service.fulfillReservation('tenant-1', reservation.reservationId);
            const availability = await service.getAvailability('tenant-1', item.inventoryItemId);
            (0, vitest_1.expect)(availability.quantityOnHand).toBe(70);
            (0, vitest_1.expect)(availability.quantityReserved).toBe(0);
            (0, vitest_1.expect)(availability.quantityAvailable).toBe(70);
        });
        (0, vitest_1.it)('prevents overbooking - two reservations cannot exceed available stock', async () => {
            const item = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget',
                unit: 'pcs',
                initialQuantity: 50,
            });
            await service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                quantity: 30,
                source: 'pos',
            });
            await (0, vitest_1.expect)(service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                quantity: 25,
                source: 'svm',
            })).rejects.toThrow(index_1.InsufficientStockError);
            const availability = await service.getAvailability('tenant-1', item.inventoryItemId);
            (0, vitest_1.expect)(availability.quantityReserved).toBe(30);
            (0, vitest_1.expect)(availability.quantityAvailable).toBe(20);
        });
        (0, vitest_1.it)('allows multiple reservations within available stock', async () => {
            const item = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget',
                unit: 'pcs',
                initialQuantity: 100,
            });
            await service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                quantity: 30,
                source: 'pos',
            });
            await service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                quantity: 20,
                source: 'svm',
            });
            const availability = await service.getAvailability('tenant-1', item.inventoryItemId);
            (0, vitest_1.expect)(availability.quantityReserved).toBe(50);
            (0, vitest_1.expect)(availability.quantityAvailable).toBe(50);
        });
    });
    (0, vitest_1.describe)('Stock Adjustments', () => {
        (0, vitest_1.it)('adjusts stock positively', async () => {
            const item = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget',
                unit: 'pcs',
                initialQuantity: 100,
            });
            const adjustment = await service.adjustStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                delta: 50,
                reason: 'Received shipment',
                actor: 'warehouse-user-1',
            });
            (0, vitest_1.expect)(adjustment.delta).toBe(50);
            const stock = await service.getStockLevel('tenant-1', item.inventoryItemId);
            (0, vitest_1.expect)(stock.quantityOnHand).toBe(150);
        });
        (0, vitest_1.it)('adjusts stock negatively', async () => {
            const item = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget',
                unit: 'pcs',
                initialQuantity: 100,
            });
            await service.adjustStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                delta: -20,
                reason: 'Damaged goods',
                actor: 'warehouse-user-1',
            });
            const stock = await service.getStockLevel('tenant-1', item.inventoryItemId);
            (0, vitest_1.expect)(stock.quantityOnHand).toBe(80);
        });
    });
    (0, vitest_1.describe)('Tenant Isolation', () => {
        (0, vitest_1.it)('prevents cross-tenant item access', async () => {
            const item = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget',
                unit: 'pcs',
            });
            await (0, vitest_1.expect)(service.getItem('tenant-2', item.inventoryItemId)).rejects.toThrow(index_1.NotFoundError);
        });
        (0, vitest_1.it)('prevents cross-tenant stock level access', async () => {
            const item = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget',
                unit: 'pcs',
                initialQuantity: 100,
            });
            await (0, vitest_1.expect)(service.getStockLevel('tenant-2', item.inventoryItemId)).rejects.toThrow(index_1.NotFoundError);
        });
        (0, vitest_1.it)('prevents cross-tenant reservation release', async () => {
            const item = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget',
                unit: 'pcs',
                initialQuantity: 100,
            });
            const reservation = await service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                quantity: 10,
                source: 'pos',
            });
            await (0, vitest_1.expect)(service.releaseReservation('tenant-2', reservation.reservationId)).rejects.toThrow(index_1.NotFoundError);
        });
        (0, vitest_1.it)('prevents cross-tenant reservation fulfillment', async () => {
            const item = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget',
                unit: 'pcs',
                initialQuantity: 100,
            });
            const reservation = await service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                quantity: 10,
                source: 'pos',
            });
            await (0, vitest_1.expect)(service.fulfillReservation('tenant-2', reservation.reservationId)).rejects.toThrow(index_1.NotFoundError);
        });
        (0, vitest_1.it)('tenants have isolated inventory lists', async () => {
            await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget A',
                unit: 'pcs',
            });
            await service.createItem({
                tenantId: 'tenant-2',
                sku: 'SKU-002',
                name: 'Widget B',
                unit: 'pcs',
            });
            const tenant1Items = await service.listItems('tenant-1');
            const tenant2Items = await service.listItems('tenant-2');
            (0, vitest_1.expect)(tenant1Items.length).toBe(1);
            (0, vitest_1.expect)(tenant2Items.length).toBe(1);
            (0, vitest_1.expect)(tenant1Items[0].sku).toBe('SKU-001');
            (0, vitest_1.expect)(tenant2Items[0].sku).toBe('SKU-002');
        });
        (0, vitest_1.it)('tenants have isolated stock levels', async () => {
            await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget A',
                unit: 'pcs',
                initialQuantity: 100,
            });
            await service.createItem({
                tenantId: 'tenant-2',
                sku: 'SKU-001',
                name: 'Widget A',
                unit: 'pcs',
                initialQuantity: 200,
            });
            const tenant1Stocks = await service.listStockLevels('tenant-1');
            const tenant2Stocks = await service.listStockLevels('tenant-2');
            (0, vitest_1.expect)(tenant1Stocks.length).toBe(1);
            (0, vitest_1.expect)(tenant2Stocks.length).toBe(1);
            (0, vitest_1.expect)(tenant1Stocks[0].quantityOnHand).toBe(100);
            (0, vitest_1.expect)(tenant2Stocks[0].quantityOnHand).toBe(200);
        });
        (0, vitest_1.it)('requires tenantId for all operations', async () => {
            await (0, vitest_1.expect)(service.listItems('')).rejects.toThrow(index_1.TenantIsolationError);
            await (0, vitest_1.expect)(service.listStockLevels('')).rejects.toThrow(index_1.TenantIsolationError);
        });
    });
    (0, vitest_1.describe)('Multi-Suite Shared Inventory (Hard Stop Condition)', () => {
        (0, vitest_1.it)('single tenant can manage inventory shared across POS, SVM, MVM without double-selling', async () => {
            const item = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SHARED-001',
                name: 'Shared Product',
                unit: 'pcs',
                initialQuantity: 100,
            });
            const posReservation = await service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                quantity: 30,
                source: 'pos',
            });
            (0, vitest_1.expect)(posReservation.source).toBe('pos');
            let availability = await service.getAvailability('tenant-1', item.inventoryItemId);
            (0, vitest_1.expect)(availability.quantityAvailable).toBe(70);
            const svmReservation = await service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                quantity: 25,
                source: 'svm',
            });
            (0, vitest_1.expect)(svmReservation.source).toBe('svm');
            availability = await service.getAvailability('tenant-1', item.inventoryItemId);
            (0, vitest_1.expect)(availability.quantityAvailable).toBe(45);
            const mvmReservation = await service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                quantity: 20,
                source: 'mvm',
            });
            (0, vitest_1.expect)(mvmReservation.source).toBe('mvm');
            availability = await service.getAvailability('tenant-1', item.inventoryItemId);
            (0, vitest_1.expect)(availability.quantityAvailable).toBe(25);
            await (0, vitest_1.expect)(service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                quantity: 30,
                source: 'system',
            })).rejects.toThrow(index_1.InsufficientStockError);
            await service.fulfillReservation('tenant-1', posReservation.reservationId);
            availability = await service.getAvailability('tenant-1', item.inventoryItemId);
            (0, vitest_1.expect)(availability.quantityOnHand).toBe(70);
            (0, vitest_1.expect)(availability.quantityReserved).toBe(45);
            (0, vitest_1.expect)(availability.quantityAvailable).toBe(25);
            await service.releaseReservation('tenant-1', svmReservation.reservationId);
            availability = await service.getAvailability('tenant-1', item.inventoryItemId);
            (0, vitest_1.expect)(availability.quantityOnHand).toBe(70);
            (0, vitest_1.expect)(availability.quantityReserved).toBe(20);
            (0, vitest_1.expect)(availability.quantityAvailable).toBe(50);
            await service.fulfillReservation('tenant-1', mvmReservation.reservationId);
            availability = await service.getAvailability('tenant-1', item.inventoryItemId);
            (0, vitest_1.expect)(availability.quantityOnHand).toBe(50);
            (0, vitest_1.expect)(availability.quantityReserved).toBe(0);
            (0, vitest_1.expect)(availability.quantityAvailable).toBe(50);
        });
        (0, vitest_1.it)('reservation from one source does not affect another tenant stock', async () => {
            const item1 = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'PRODUCT-001',
                name: 'Product',
                unit: 'pcs',
                initialQuantity: 100,
            });
            const item2 = await service.createItem({
                tenantId: 'tenant-2',
                sku: 'PRODUCT-001',
                name: 'Product',
                unit: 'pcs',
                initialQuantity: 100,
            });
            await service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item1.inventoryItemId,
                quantity: 80,
                source: 'pos',
            });
            const tenant1Availability = await service.getAvailability('tenant-1', item1.inventoryItemId);
            const tenant2Availability = await service.getAvailability('tenant-2', item2.inventoryItemId);
            (0, vitest_1.expect)(tenant1Availability.quantityAvailable).toBe(20);
            (0, vitest_1.expect)(tenant2Availability.quantityAvailable).toBe(100);
        });
    });
    (0, vitest_1.describe)('Availability Query', () => {
        (0, vitest_1.it)('returns correct availability calculation', async () => {
            const item = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget',
                unit: 'pcs',
                initialQuantity: 100,
            });
            await service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                quantity: 25,
                source: 'pos',
            });
            const availability = await service.getAvailability('tenant-1', item.inventoryItemId);
            (0, vitest_1.expect)(availability.inventoryItemId).toBe(item.inventoryItemId);
            (0, vitest_1.expect)(availability.tenantId).toBe('tenant-1');
            (0, vitest_1.expect)(availability.quantityOnHand).toBe(100);
            (0, vitest_1.expect)(availability.quantityReserved).toBe(25);
            (0, vitest_1.expect)(availability.quantityAvailable).toBe(75);
        });
    });
    (0, vitest_1.describe)('Error Handling', () => {
        (0, vitest_1.it)('throws NotFoundError for non-existent item', async () => {
            await (0, vitest_1.expect)(service.getItem('tenant-1', '00000000-0000-0000-0000-000000000000')).rejects.toThrow(index_1.NotFoundError);
        });
        (0, vitest_1.it)('throws InsufficientStockError when reserving more than available', async () => {
            const item = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget',
                unit: 'pcs',
                initialQuantity: 10,
            });
            await (0, vitest_1.expect)(service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                quantity: 20,
                source: 'pos',
            })).rejects.toThrow(index_1.InsufficientStockError);
        });
        (0, vitest_1.it)('prevents releasing already released reservation', async () => {
            const item = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget',
                unit: 'pcs',
                initialQuantity: 100,
            });
            const reservation = await service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                quantity: 10,
                source: 'pos',
            });
            await service.releaseReservation('tenant-1', reservation.reservationId);
            await (0, vitest_1.expect)(service.releaseReservation('tenant-1', reservation.reservationId)).rejects.toThrow('Cannot release reservation with status: released');
        });
        (0, vitest_1.it)('prevents fulfilling already fulfilled reservation', async () => {
            const item = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'SKU-001',
                name: 'Widget',
                unit: 'pcs',
                initialQuantity: 100,
            });
            const reservation = await service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                quantity: 10,
                source: 'pos',
            });
            await service.fulfillReservation('tenant-1', reservation.reservationId);
            await (0, vitest_1.expect)(service.fulfillReservation('tenant-1', reservation.reservationId)).rejects.toThrow('Cannot fulfill reservation with status: fulfilled');
        });
    });
    (0, vitest_1.describe)('Multi-Location Support', () => {
        (0, vitest_1.it)('reserves stock at specific location and releases to correct location', async () => {
            const item = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'LOC-001',
                name: 'Location Product',
                unit: 'pcs',
                initialQuantity: 100,
                locationId: 'warehouse-a',
            });
            const reservation = await service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                quantity: 30,
                source: 'pos',
                locationId: 'warehouse-a',
            });
            (0, vitest_1.expect)(reservation.locationId).toBe('warehouse-a');
            let availability = await service.getAvailability('tenant-1', item.inventoryItemId, 'warehouse-a');
            (0, vitest_1.expect)(availability.quantityReserved).toBe(30);
            (0, vitest_1.expect)(availability.quantityAvailable).toBe(70);
            await service.releaseReservation('tenant-1', reservation.reservationId);
            availability = await service.getAvailability('tenant-1', item.inventoryItemId, 'warehouse-a');
            (0, vitest_1.expect)(availability.quantityReserved).toBe(0);
            (0, vitest_1.expect)(availability.quantityAvailable).toBe(100);
        });
        (0, vitest_1.it)('reserves stock at specific location and fulfills to correct location', async () => {
            const item = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'LOC-002',
                name: 'Location Product 2',
                unit: 'pcs',
                initialQuantity: 50,
                locationId: 'warehouse-b',
            });
            const reservation = await service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                quantity: 20,
                source: 'mvm',
                locationId: 'warehouse-b',
            });
            await service.fulfillReservation('tenant-1', reservation.reservationId);
            const availability = await service.getAvailability('tenant-1', item.inventoryItemId, 'warehouse-b');
            (0, vitest_1.expect)(availability.quantityOnHand).toBe(30);
            (0, vitest_1.expect)(availability.quantityReserved).toBe(0);
            (0, vitest_1.expect)(availability.quantityAvailable).toBe(30);
        });
        (0, vitest_1.it)('prevents overbooking at specific location', async () => {
            const item = await service.createItem({
                tenantId: 'tenant-1',
                sku: 'LOC-003',
                name: 'Limited Stock Product',
                unit: 'pcs',
                initialQuantity: 10,
                locationId: 'warehouse-c',
            });
            await service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                quantity: 8,
                source: 'pos',
                locationId: 'warehouse-c',
            });
            await (0, vitest_1.expect)(service.reserveStock({
                tenantId: 'tenant-1',
                inventoryItemId: item.inventoryItemId,
                quantity: 5,
                source: 'svm',
                locationId: 'warehouse-c',
            })).rejects.toThrow(index_1.InsufficientStockError);
        });
    });
});
//# sourceMappingURL=inventory.test.js.map