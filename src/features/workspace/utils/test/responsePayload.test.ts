import { describe, expect, test } from 'bun:test';

import {
  formatPrimitiveValue,
  getPayloadText,
  getTypeLabel,
  isPrimitive,
  isRecord,
} from '../responsePayload';

describe('responsePayload utilities', () => {
  test('identifies records without treating arrays or null as records', () => {
    expect(isRecord({ status: 'ok' })).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
  });

  test('identifies JSON primitive values', () => {
    expect(isPrimitive(null)).toBe(true);
    expect(isPrimitive('ok')).toBe(true);
    expect(isPrimitive(200)).toBe(true);
    expect(isPrimitive(false)).toBe(true);
    expect(isPrimitive({ nested: true })).toBe(false);
  });

  test('formats payload values for display', () => {
    expect(getPayloadText('raw response')).toBe('raw response');
    expect(getPayloadText({ ok: true })).toBe('{\n  "ok": true\n}');
    expect(formatPrimitiveValue('hello')).toBe('"hello"');
    expect(formatPrimitiveValue(null)).toBe('null');
    expect(formatPrimitiveValue(42)).toBe('42');
  });

  test('creates readable type labels', () => {
    expect(getTypeLabel(['a', 'b'])).toBe('Array(2)');
    expect(getTypeLabel(null)).toBe('null');
    expect(getTypeLabel({ ok: true })).toBe('object');
  });
});
