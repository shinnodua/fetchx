import { describe, expect, test } from 'bun:test';
import { useGitHubDeviceFlow } from '../useGitHubDeviceFlow';

describe('useGitHubDeviceFlow', () => {
  test('is defined as a hook function', () => {
    expect(typeof useGitHubDeviceFlow).toBe('function');
  });
});
