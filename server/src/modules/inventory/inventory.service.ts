import { InventoryItem, type InventoryItemDocument } from './inventoryItem.model';
import { InventoryTransaction, type InventoryTransactionDocument } from './inventoryTransaction.model';
import { AppError } from '../../utils/AppError';
import type { CreateTransactionInput } from './inventory.validation';

// Computes a new quantity after applying a change (positive for
// purchases/returns, negative for sales/waste), rejecting any change that
// would push stock below zero — you can't have "negative" physical stock.
export function applyQuantityChange(currentQuantity: number, quantityChange: number): number {
  const next = round2(currentQuantity + quantityChange);
  if (next < 0) {
    throw new AppError('Resulting quantity cannot be negative', 400);
  }
  return next;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// "Low stock" is defined as quantity at or below the item's own configured
// minStockThreshold. `$expr` is needed here because the comparison is
// between two fields on the same document, not a field vs. a fixed value.
export function listLowStockItems(): Promise<InventoryItemDocument[]> {
  return InventoryItem.find({
    active: true,
    $expr: { $lte: ['$quantity', '$minStockThreshold'] },
  }).sort({ name: 1 });
}

const MAX_CONCURRENT_UPDATE_ATTEMPTS = 5;

// Records a stock change (purchase, sale, adjustment, waste, or return) and
// updates the item's quantity, atomically.
//
// Why this needs care: if two staff members adjust the same item's stock at
// nearly the same time, a naive "read quantity, compute new value, save"
// sequence could lose one of the updates (a classic race condition). This
// function guards against that with optimistic concurrency control:
//   1. Read the item's current quantity.
//   2. Compute the new quantity.
//   3. Write the update ONLY if the quantity in the database still matches
//      what was read in step 1 (`findOneAndUpdate({ _id, quantity: quantityBefore }, ...)`).
//      If another request changed it in between, this update matches
//      nothing and `updated` comes back null.
//   4. If that happens, retry from step 1 (up to 5 times) with the now-current quantity.
// Only after a successful quantity update does it create the
// InventoryTransaction audit record, so the transaction log and the actual
// quantity never disagree.
export async function recordTransaction(
  inventoryItemId: string,
  input: CreateTransactionInput,
  createdBy: string,
): Promise<{ item: InventoryItemDocument; transaction: InventoryTransactionDocument }> {
  for (let attempt = 0; attempt < MAX_CONCURRENT_UPDATE_ATTEMPTS; attempt += 1) {
    const current = await InventoryItem.findById(inventoryItemId);
    if (!current) {
      throw new AppError('Inventory item not found', 404);
    }

    const quantityBefore = current.quantity;
    const quantityAfter = applyQuantityChange(quantityBefore, input.quantityChange);

    // Atomic compare-and-swap: only applies if quantity hasn't changed since we read it,
    // preventing lost updates from concurrent stock adjustments on the same item.
    const updated = await InventoryItem.findOneAndUpdate(
      { _id: inventoryItemId, quantity: quantityBefore },
      { $set: { quantity: quantityAfter } },
      { new: true },
    );

    if (!updated) {
      continue;
    }

    const transaction = await InventoryTransaction.create({
      inventoryItem: updated._id,
      type: input.type,
      quantityChange: input.quantityChange,
      quantityBefore,
      quantityAfter,
      reason: input.reason,
      createdBy,
    });

    return { item: updated, transaction };
  }

  throw new AppError('Inventory item is being updated concurrently, please retry', 409);
}

// Full transaction history for one item, most recent first, with the
// staff member who made each change attached.
export function listTransactionsForItem(inventoryItemId: string): Promise<InventoryTransactionDocument[]> {
  return InventoryTransaction.find({ inventoryItem: inventoryItemId })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email');
}
