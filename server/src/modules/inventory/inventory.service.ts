import { InventoryItem, type InventoryItemDocument } from './inventoryItem.model';
import { InventoryTransaction, type InventoryTransactionDocument } from './inventoryTransaction.model';
import { AppError } from '../../utils/AppError';
import type { CreateTransactionInput } from './inventory.validation';

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

export function listLowStockItems(): Promise<InventoryItemDocument[]> {
  return InventoryItem.find({
    active: true,
    $expr: { $lte: ['$quantity', '$minStockThreshold'] },
  }).sort({ name: 1 });
}

const MAX_CONCURRENT_UPDATE_ATTEMPTS = 5;

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

export function listTransactionsForItem(inventoryItemId: string): Promise<InventoryTransactionDocument[]> {
  return InventoryTransaction.find({ inventoryItem: inventoryItemId })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email');
}
