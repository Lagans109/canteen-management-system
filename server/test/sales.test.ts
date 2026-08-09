import { describe, expect, it } from 'vitest';
import { calculateLineItems, round2 } from '../src/modules/sales/sale.service';
import { createSaleSchema } from '../src/modules/sales/sale.validation';
import { AppError } from '../src/utils/AppError';

describe('calculateLineItems', () => {
  it('computes line totals and the overall total for multiple items', () => {
    const catalog = new Map([
      ['samosa', { id: 'samosa', name: 'Samosa', price: 15 }],
      ['tea', { id: 'tea', name: 'Tea', price: 10 }],
      ['maggi', { id: 'maggi', name: 'Maggi', price: 30 }],
    ]);

    const { lines, totalAmount } = calculateLineItems(
      [
        { menuItem: 'samosa', quantity: 2 },
        { menuItem: 'tea', quantity: 1 },
        { menuItem: 'maggi', quantity: 1 },
      ],
      catalog,
    );

    expect(lines).toEqual([
      { menuItem: 'samosa', name: 'Samosa', unitPrice: 15, quantity: 2, lineTotal: 30 },
      { menuItem: 'tea', name: 'Tea', unitPrice: 10, quantity: 1, lineTotal: 10 },
      { menuItem: 'maggi', name: 'Maggi', unitPrice: 30, quantity: 1, lineTotal: 30 },
    ]);
    expect(totalAmount).toBe(70);
  });

  it('rounds fractional totals to 2 decimal places', () => {
    const catalog = new Map([['item', { id: 'item', name: 'Item', price: 19.99 }]]);
    const { lines, totalAmount } = calculateLineItems([{ menuItem: 'item', quantity: 3 }], catalog);
    expect(lines[0]?.lineTotal).toBe(59.97);
    expect(totalAmount).toBe(59.97);
  });

  it('throws when a requested item is not in the catalog (unavailable/inactive/unknown)', () => {
    const catalog = new Map<string, { id: string; name: string; price: number }>();
    expect(() => calculateLineItems([{ menuItem: 'missing', quantity: 1 }], catalog)).toThrow(AppError);
  });
});

describe('round2', () => {
  it('rounds to two decimal places', () => {
    expect(round2(10.005)).toBeCloseTo(10.01, 2);
    expect(round2(10.004)).toBe(10);
  });
});

describe('createSaleSchema', () => {
  it('accepts a valid sale payload', () => {
    const result = createSaleSchema.safeParse({
      items: [{ menuItem: '507f1f77bcf86cd799439011', quantity: 2 }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty items array', () => {
    const result = createSaleSchema.safeParse({ items: [] });
    expect(result.success).toBe(false);
  });

  it('rejects a non-positive quantity', () => {
    const result = createSaleSchema.safeParse({
      items: [{ menuItem: '507f1f77bcf86cd799439011', quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid menu item id', () => {
    const result = createSaleSchema.safeParse({ items: [{ menuItem: 'not-an-id', quantity: 1 }] });
    expect(result.success).toBe(false);
  });
});
