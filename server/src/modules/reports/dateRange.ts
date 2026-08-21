// The set of date-range shortcuts the Reports page and dashboard can
// request instead of specifying exact dates.
export type DatePreset = 'today' | 'yesterday' | 'last7days' | 'week' | 'month' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

function startOfMonth(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

// Converts a named preset (plus the current time and, for "custom", the
// client-supplied from/to) into a concrete {start, end} Date range that the
// reports service's MongoDB queries can filter `createdAt` against.
// `now` is passed in explicitly (rather than read internally) so this
// function stays pure and easy to test with a fixed date.
export function resolveDateRange(
  preset: DatePreset,
  now: Date,
  custom?: { from?: string; to?: string },
): DateRange {
  switch (preset) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    }
    case 'last7days': {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return { start: startOfDay(start), end: endOfDay(now) };
    }
    case 'week':
      return { start: startOfWeek(now), end: endOfDay(now) };
    case 'month':
      return { start: startOfMonth(now), end: endOfDay(now) };
    case 'custom': {
      if (!custom?.from || !custom?.to) {
        throw new Error('Custom date range requires "from" and "to"');
      }
      return { start: startOfDay(new Date(custom.from)), end: endOfDay(new Date(custom.to)) };
    }
  }
}
