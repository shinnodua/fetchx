export type RenameTarget =
  | { type: 'collection'; id: string; name: string }
  | { type: 'request'; id: string; name: string };

export type ContextMenuTarget =
  | { type: 'collection'; id: string; name: string; x: number; y: number }
  | { type: 'request'; id: string; name: string; x: number; y: number };
