import { describe, expect, it } from 'vitest';
import { resolveDateRange } from '../src/modules/reports/dateRange';
import { reportQuerySchema } from '../src/modules/reports/reports.validation';

const NOW = new Date('2026-08-09T15:30:00.000Z');

describe('resolveDateRange', () => {
  it('resolves "today" to the start and end of the current day', () => {
    const { start, end } = resolveDateRange('today', NOW);
    expect(start.getDate()).toBe(NOW.getDate());
    expect(start.getHours()).toBe(0);
    expect(end.getHours()).toBe(23);
  });

  it('resolves "yesterday" to the previous calendar day', () => {
    const { start, end } = resolveDateRange('yesterday', NOW);
    expect(start.getDate()).toBe(NOW.getDate() - 1);
    expect(end.getDate()).toBe(NOW.getDate() - 1);
  });

  it('resolves "last7days" to span exactly 7 days including today', () => {
    const { start, end } = resolveDateRange('last7days', NOW);
    const diffDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    expect(diffDays).toBe(7);
  });

  it('resolves "custom" using the provided from/to', () => {
    const { start, end } = resolveDateRange('custom', NOW, { from: '2026-08-01', to: '2026-08-03' });
    expect(start.getDate()).toBe(1);
    expect(start.getHours()).toBe(0);
    expect(end.getDate()).toBe(3);
    expect(end.getHours()).toBe(23);
  });

  it('throws for "custom" without from/to', () => {
    expect(() => resolveDateRange('custom', NOW)).toThrow();
  });
});

describe('reportQuerySchema', () => {
  it('defaults preset to "today"', () => {
    const result = reportQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.preset).toBe('today');
    }
  });

  it('requires from/to when preset is custom', () => {
    const result = reportQuerySchema.safeParse({ preset: 'custom' });
    expect(result.success).toBe(false);
  });

  it('accepts custom preset with from/to', () => {
    const result = reportQuerySchema.safeParse({ preset: 'custom', from: '2026-08-01', to: '2026-08-03' });
    expect(result.success).toBe(true);
  });
});
