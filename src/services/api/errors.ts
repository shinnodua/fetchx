interface ApiErrorResponse {
  error?: {
    message?: unknown;
  };
}

export function getApiErrorMessage(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const response = value as ApiErrorResponse;
  return typeof response.error?.message === 'string'
    ? response.error.message
    : null;
}
