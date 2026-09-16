import { describe, expect, test } from 'bun:test';

import {
  discoverLocalAiAgents,
  getDesktopDownloadDevicePlatform,
  localAiAgentCommandNames,
} from '../platform';

describe('platform utilities', () => {
  test('detects macOS devices for desktop downloads', () => {
    expect(
      getDesktopDownloadDevicePlatform({
        platform: 'MacIntel',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        maxTouchPoints: 0,
      }),
    ).toBe('mac');
  });

  test('does not treat iOS devices as macOS downloads', () => {
    expect(
      getDesktopDownloadDevicePlatform({
        platform: 'iPhone',
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        maxTouchPoints: 5,
      }),
    ).toBe('other');
  });

  test('does not treat iPadOS desktop-mode browser as macOS', () => {
    expect(
      getDesktopDownloadDevicePlatform({
        platform: 'MacIntel',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15',
        maxTouchPoints: 5,
      }),
    ).toBe('other');
  });

  test('detects Windows devices for desktop downloads', () => {
    expect(
      getDesktopDownloadDevicePlatform({
        platform: 'Win32',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      }),
    ).toBe('windows');
  });

  test('does not discover local AI agents in the web app shell', async () => {
    expect(await discoverLocalAiAgents()).toEqual([]);
  });

  test('uses the desktop command names registered by the local-agent bridge', () => {
    expect(localAiAgentCommandNames).toEqual({
      chat: 'chat_with_ai_agent',
      discover: 'discover_ai_agents',
      discoverModels: 'discover_ai_agent_models',
    });
  });
});
