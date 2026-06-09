export type JsonPrimitive = string | number | boolean | null;

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isPrimitive = (value: unknown): value is JsonPrimitive =>
  value === null ||
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean';

export const getPayloadText = (data: unknown): string => {
  if (typeof data === 'string') return data;
  return JSON.stringify(data, null, 2);
};

export const formatPrimitiveValue = (value: JsonPrimitive): string => {
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  return String(value);
};

export const getTypeLabel = (value: unknown): string => {
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (value === null) return 'null';
  return typeof value;
};

export const createDefaultResponseName = (): string => {
  const now = new Date();
  const date = now.toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const time = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return `${date} ${time}`;
};
