interface ErrorLike {
  cause?: unknown;
  code?: unknown;
  data?: unknown;
  details?: unknown;
  message?: unknown;
  shortMessage?: unknown;
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

  const causeMessage = findWalletErrorMessage(error.cause, visited);
  if (causeMessage) return causeMessage;

  const dataMessage = isErrorLike(error.data)
    ? findWalletErrorMessage(error.data, visited)
    : getMessage(error.data);
  if (dataMessage) return dataMessage;

  return (
    getMessage(error.details) ||
    getMessage(error.shortMessage) ||
    getMessage(error.message)
  );
}

export function getWalletErrorMessage(error: unknown): string {
  const message = findWalletErrorMessage(error, new Set());
  if (message) return message;

  return error instanceof Error ? error.message : 'Unknown wallet error.';
}
