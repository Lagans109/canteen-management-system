import { describe, expect, it } from 'vitest';
import { createMenuItemSchema, createCategorySchema } from '../src/modules/menu/menu.validation';

describe('createCategorySchema', () => {
  it('accepts a valid category', () => {
    const result = createCategorySchema.safeParse({ name: 'Snacks' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = createCategorySchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});

describe('createMenuItemSchema', () => {
  const base = { name: 'Samosa', price: 15, category: '507f1f77bcf86cd799439011' };

  it('accepts a valid menu item and defaults active/available to true', () => {
    const result = createMenuItemSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(true);
      expect(result.data.available).toBe(true);
    }
  });

  it('rejects a negative price', () => {
    const result = createMenuItemSchema.safeParse({ ...base, price: -5 });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid category id', () => {
    const result = createMenuItemSchema.safeParse({ ...base, category: 'not-an-id' });
    expect(result.success).toBe(false);
  });

  it('rejects a malformed image URL', () => {
    const result = createMenuItemSchema.safeParse({ ...base, imageUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });
});
