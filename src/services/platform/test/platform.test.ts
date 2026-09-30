import { describe, expect, mock, test } from 'bun:test';

import {
  discoverLocalAiAgents,
  getDesktopDownloadDevicePlatform,
  localAiAgentCommandNames,
  openBrowserDownloadWindow,
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

  test('opens a browser download window during the user interaction', () => {
    const downloadWindow = { opener: null } as Window;
    const openWindow = mock(() => downloadWindow);

    expect(openBrowserDownloadWindow(openWindow)).toBe(downloadWindow);
    expect(openWindow).toHaveBeenCalledWith('', '_blank');
    expect(downloadWindow.opener).toBeNull();
  });

  test('explains how to unblock browser download windows', () => {
    expect(() => openBrowserDownloadWindow(() => null)).toThrow(
      'Your browser blocked the download window. Allow pop-ups for this site and try again.',
    );
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

  test('rejects executeNativeHttpRequest when running in web app shell', async () => {
    const { executeNativeHttpRequest } = await import('../platform');
    expect(
      executeNativeHttpRequest({
        url: 'https://api.pilauncher.org/v1/public/servers/community',
      }),
    ).rejects.toThrow(
      'Native HTTP requests are only available in the desktop app.',
    );
  });
});
