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
