import type { CollectionItem, RequestItem } from '../types';
import { parseCurl } from './requestImport';

export function normalizeRequestTarget(target: string | undefined) {
  const trimmedTarget = target?.trim();
  if (!trimmedTarget) return '';

  const curlTarget = /^curl(?:\.exe)?\b/i.test(trimmedTarget)
    ? parseCurl(trimmedTarget).target
    : trimmedTarget;

  try {
    const url = new URL(curlTarget);
    return `${url.origin}${url.pathname}`;
  } catch {
    return curlTarget.trim();
  }
}

export function findRequestByTarget(
  collections: CollectionItem[],
  target: string | undefined,
  drafts: Record<string, RequestItem> = {},
): RequestItem | undefined {
  const normalizedTarget = normalizeRequestTarget(target);
  if (!normalizedTarget) return undefined;

  const draft = Object.values(drafts).find(
    (item) => normalizeRequestTarget(item.target) === normalizedTarget,
  );
  if (draft) return draft;

  for (const collection of collections) {
    const request = collection.requests.find(
      (item) => normalizeRequestTarget(item.target) === normalizedTarget,
    );
    if (request) return request;
  }

  return undefined;
}
