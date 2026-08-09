import { describe, expect, it } from 'vitest';
import { applyQuantityChange } from '../src/modules/inventory/inventory.service';
import { createInventoryItemSchema, createTransactionSchema } from '../src/modules/inventory/inventory.validation';
import { AppError } from '../src/utils/AppError';

describe('applyQuantityChange', () => {
  it('adds stock for a positive change', () => {
    expect(applyQuantityChange(10, 5)).toBe(15);
  });

  it('reduces stock for a negative change', () => {
    expect(applyQuantityChange(10, -4)).toBe(6);
  });

  it('throws when the resulting quantity would be negative', () => {
    expect(() => applyQuantityChange(5, -10)).toThrow(AppError);
  });

  it('allows reducing exactly to zero', () => {
    expect(applyQuantityChange(5, -5)).toBe(0);
  });
});

describe('createInventoryItemSchema', () => {
  it('accepts a valid inventory item', () => {
    const result = createInventoryItemSchema.safeParse({
      name: 'Rice',
      unit: 'kg',
      quantity: 50,
      minStockThreshold: 10,
      costPrice: 40,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a negative quantity', () => {
    const result = createInventoryItemSchema.safeParse({ name: 'Rice', unit: 'kg', quantity: -1 });
    expect(result.success).toBe(false);
  });
});

describe('createTransactionSchema', () => {
  it('accepts a valid PURCHASE transaction', () => {
    const result = createTransactionSchema.safeParse({ type: 'PURCHASE', quantityChange: 10 });
    expect(result.success).toBe(true);
  });

  it('rejects a zero quantityChange', () => {
    const result = createTransactionSchema.safeParse({ type: 'ADJUSTMENT', quantityChange: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown transaction type', () => {
    const result = createTransactionSchema.safeParse({ type: 'REFUND', quantityChange: 5 });
    expect(result.success).toBe(false);
  });
});
