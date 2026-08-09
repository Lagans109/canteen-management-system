import { describe, expect, it } from 'vitest';
import { createSupplierSchema } from '../src/modules/suppliers/supplier.validation';

describe('createSupplierSchema', () => {
  it('accepts a minimal valid supplier', () => {
    const result = createSupplierSchema.safeParse({ name: 'Fresh Farms' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = createSupplierSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = createSupplierSchema.safeParse({ name: 'Fresh Farms', email: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});
