export interface DesktopUpdate {
  version: string;
  notes?: string;
  publishedAt?: string;
  downloadAndInstall: (
    onProgress?: (progress: number | null) => void,
  ) => Promise<void>;
}

export interface OpenTextFileOptions {
  extensions: string[];
  name: string;
}

export interface SaveTextFileOptions extends OpenTextFileOptions {
  defaultPath: string;
}

export interface LocalAiAgent {
  id: string;
  name: string;
  kind: 'cli' | 'http';
  command?: string;
  endpoint?: string;
  protocol: string;
}

export interface LocalAiAgentModel {
  id: string;
  name: string;
}

export interface AiAgentChatResult {
  content: string;
}
