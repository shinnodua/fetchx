import { describe, expect, test } from 'bun:test';
import {
  consoleLogsButtonClassName,
  consoleLogsDialogContentClassName,
  responsePaneContentClassName,
} from '../ResponsePane';

describe('ResponsePane', () => {
  test('uses a compact trigger and scrollable dialog for console logs', () => {
    expect(consoleLogsButtonClassName).toContain('text-[10px]');
    expect(consoleLogsDialogContentClassName).toContain('overflow-auto');
    expect(consoleLogsDialogContentClassName).toContain('font-mono');
  });

  test('keeps response scrolling inside the payload result card', () => {
    expect(responsePaneContentClassName).toContain('overflow-hidden');
    expect(responsePaneContentClassName).not.toContain('overflow-y-auto');
  });
});
