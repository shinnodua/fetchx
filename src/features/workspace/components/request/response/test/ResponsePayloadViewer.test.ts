import { describe, expect, test } from 'bun:test';
import {
  getPayloadKeyLineInset,
  payloadInspectorRowClassName,
  payloadPreviewCardClassName,
  rawPayloadCodeClassName,
} from '../ResponsePayloadViewer';

describe('ResponsePayloadViewer', () => {
  test('uses compact typography and padding for preview and raw payloads', () => {
    expect(payloadInspectorRowClassName).toContain('px-2');
    expect(payloadInspectorRowClassName).toContain('py-0.5');
    expect(payloadInspectorRowClassName).toContain('text-[11px]');
    expect(rawPayloadCodeClassName).toContain('text-[11px]');
    expect(rawPayloadCodeClassName).toContain('leading-4');
  });

  test('starts preview row separators at the key label indentation', () => {
    expect(getPayloadKeyLineInset(0)).toBe('calc(0.5rem + 20px)');
    expect(getPayloadKeyLineInset(2)).toBe('calc(0.5rem + 44px)');
    expect(payloadInspectorRowClassName).toContain(
      'after:left-[var(--payload-key-line-inset)]',
    );
    expect(payloadInspectorRowClassName).toContain('after:border-dashed');
  });

  test('matches the response pane radius for the preview payload card', () => {
    expect(payloadPreviewCardClassName).toContain('flex-1');
    expect(payloadPreviewCardClassName).toContain('min-h-0');
    expect(payloadPreviewCardClassName).toContain('rounded-2xl');
    expect(payloadPreviewCardClassName).toContain('round_1rem');
    expect(payloadPreviewCardClassName).not.toContain('rounded-lg');
  });
});
