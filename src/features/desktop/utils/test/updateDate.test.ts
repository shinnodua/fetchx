import { describe, expect, test } from 'bun:test';
import { formatPublishedDate, formatUpdateDescription } from '../updateDate';

describe('updateDate utils', () => {
  test('formats valid ISO date string to user-readable local date and time', () => {
    const iso = '2026-09-22T02:13:02.889Z';
    const formatted = formatPublishedDate(iso, 'en-US');

    expect(formatted).toBeDefined();
    expect(formatted).toContain('2026');
    expect(formatted).toContain('Sep 22');
  });

  test('returns undefined for empty or missing date string', () => {
    expect(formatPublishedDate(undefined)).toBeUndefined();
    expect(formatPublishedDate('')).toBeUndefined();
    expect(formatPublishedDate('   ')).toBeUndefined();
  });

  test('falls back to raw string when string is not a parseable date', () => {
    expect(formatPublishedDate('unknown-date')).toBe('unknown-date');
  });

  test('formats update description with user-readable published date', () => {
    const iso = '2026-09-22T02:13:02.889Z';
    const description = formatUpdateDescription(iso, 'en-US');

    expect(description).toBeDefined();
    expect(description?.startsWith('Published ')).toBe(true);
    expect(description).toContain('Sep 22, 2026');
  });

  test('returns undefined update description when publishedAt is absent', () => {
    expect(formatUpdateDescription(undefined)).toBeUndefined();
    expect(formatUpdateDescription('')).toBeUndefined();
  });
});
