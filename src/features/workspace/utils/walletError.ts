interface ErrorLike {
  cause?: unknown;
  code?: unknown;
  data?: unknown;
  details?: unknown;
  message?: unknown;
  shortMessage?: unknown;
  metaMessages?: unknown;
}

function isErrorLike(value: unknown): value is ErrorLike {
  return typeof value === 'object' && value !== null;
}

function getMessage(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function findWalletErrorMessage(error: unknown, visited: Set<unknown>): string {
  if (!isErrorLike(error) || visited.has(error)) return '';
  visited.add(error);

  // 1. Prioritize clean, structured messages if present at this level
  const shortMsg = getMessage(error.shortMessage);
  const detailsMsg = getMessage(error.details);
  if (shortMsg || detailsMsg) {
    const cleanMsg = shortMsg || detailsMsg;
    if (Array.isArray(error.metaMessages) && error.metaMessages.length > 0) {
      const metaText = error.metaMessages
        .map((msg) => (typeof msg === 'string' ? msg.trim() : ''))
        .filter(Boolean)
        .join('\n');
      if (metaText) {
        return `${cleanMsg}\n\n${metaText}`;
      }
    }
    return cleanMsg;
  }

  // 2. Otherwise, check cause recursively
  const causeMessage = findWalletErrorMessage(error.cause, visited);
  if (causeMessage) return causeMessage;

  // 3. Check data recursively
  const dataMessage = isErrorLike(error.data)
    ? findWalletErrorMessage(error.data, visited)
    : getMessage(error.data);
  if (dataMessage) return dataMessage;

  // 4. Fallback to the generic message of the current level
  return getMessage(error.message);
}

export function getWalletErrorMessage(error: unknown): string {
  const message = findWalletErrorMessage(error, new Set());
  if (message) return message;

  return error instanceof Error ? error.message : 'Unknown wallet error.';
}
