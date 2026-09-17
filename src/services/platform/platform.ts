import type {
  AiAgentChatResult,
  DesktopUpdate,
  LocalAiAgent,
  LocalAiAgentModel,
  OpenTextFileOptions,
  SaveTextFileOptions,
} from './types';

export type DesktopDownloadDevicePlatform = 'mac' | 'windows' | 'other';

export const localAiAgentCommandNames = {
  chat: 'chat_with_ai_agent',
  discover: 'discover_ai_agents',
  discoverModels: 'discover_ai_agent_models',
} as const;

interface DesktopDownloadNavigator {
  maxTouchPoints?: number;
  platform?: string;
  userAgent?: string;
}

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

export const isDesktopApp = () =>
  typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__);

export function openBrowserDownloadWindow(
  openWindow: (
    url?: string,
    target?: string,
  ) => Window | null = window.open.bind(window),
) {
  const downloadWindow = openWindow('', '_blank');
  if (!downloadWindow) {
    throw new Error(
      'Your browser blocked the download window. Allow pop-ups for this site and try again.',
    );
  }

  downloadWindow.opener = null;
  return downloadWindow;
}

export const getDesktopDownloadDevicePlatform = (
  navigatorSource: DesktopDownloadNavigator | undefined = typeof navigator ===
  'undefined'
    ? undefined
    : navigator,
): DesktopDownloadDevicePlatform => {
  if (!navigatorSource) return 'other';

  const platform = navigatorSource.platform?.toLowerCase() || '';
  const userAgent = navigatorSource.userAgent?.toLowerCase() || '';
  const maxTouchPoints = navigatorSource.maxTouchPoints || 0;
  const isIosDevice =
    /iphone|ipad|ipod/.test(userAgent) ||
    (platform === 'macintel' && maxTouchPoints > 1);

  if (
    !isIosDevice &&
    (platform.startsWith('mac') || userAgent.includes('macintosh'))
  ) {
    return 'mac';
  }

  if (platform.startsWith('win') || userAgent.includes('windows')) {
    return 'windows';
  }

  return 'other';
};

export async function openExternalUrl(url: string) {
  if (isDesktopApp()) {
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    await openUrl(url);
    return;
  }

  window.open(url, '_blank', 'noreferrer');
}

export async function saveTextFile(
  content: string,
  options: SaveTextFileOptions,
) {
  if (isDesktopApp()) {
    const [{ save }, { writeTextFile }] = await Promise.all([
      import('@tauri-apps/plugin-dialog'),
      import('@tauri-apps/plugin-fs'),
    ]);
    const path = await save({
      defaultPath: options.defaultPath,
      filters: [{ name: options.name, extensions: options.extensions }],
    });
    if (!path) return false;
    await writeTextFile(path, content);
    return true;
  }

  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = options.defaultPath;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}

export async function openTextFile(options: OpenTextFileOptions) {
  if (!isDesktopApp()) return null;

  const [{ open }, { readTextFile }] = await Promise.all([
    import('@tauri-apps/plugin-dialog'),
    import('@tauri-apps/plugin-fs'),
  ]);
  const path = await open({
    multiple: false,
    directory: false,
    filters: [{ name: options.name, extensions: options.extensions }],
  });
  return typeof path === 'string' ? readTextFile(path) : null;
}

export async function checkForDesktopUpdate(): Promise<DesktopUpdate | null> {
  if (!isDesktopApp()) return null;

  const { check } = await import('@tauri-apps/plugin-updater');
  const update = await check();
  if (!update) return null;

  return {
    version: update.version,
    notes: update.body,
    publishedAt: update.date,
    downloadAndInstall: async (onProgress) => {
      let downloaded = 0;
      let total: number | null = null;
      await update.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          total = event.data.contentLength ?? null;
          onProgress?.(total ? 0 : null);
          return;
        }
        if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          onProgress?.(total ? Math.min(downloaded / total, 1) : null);
          return;
        }
        onProgress?.(1);
      });
    },
  };
}

export async function relaunchDesktopApp() {
  if (!isDesktopApp()) return;
  const { relaunch } = await import('@tauri-apps/plugin-process');
  await relaunch();
}

export async function discoverLocalAiAgents(): Promise<LocalAiAgent[]> {
  if (!isDesktopApp()) return [];

  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<LocalAiAgent[]>(localAiAgentCommandNames.discover);
}

export async function chatWithLocalAiAgent(input: {
  agent: LocalAiAgent;
  model?: string;
  prompt: string;
}): Promise<AiAgentChatResult> {
  if (!isDesktopApp()) {
    throw new Error('Local AI agents are available in the desktop app.');
  }

  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<AiAgentChatResult>(localAiAgentCommandNames.chat, { input });
}

export async function discoverLocalAiAgentModels(
  agent: LocalAiAgent,
): Promise<LocalAiAgentModel[]> {
  if (!isDesktopApp()) return [];

  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<LocalAiAgentModel[]>(localAiAgentCommandNames.discoverModels, {
    agent,
  });
}
