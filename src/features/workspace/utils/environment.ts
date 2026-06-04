import type { EnvironmentVariable } from '../types';

const REDACTED_VALUE = '[REDACTED]';

export interface VariableResolution {
  redacted: string;
  value: string;
}

export function replaceVariables(
  text: string,
  variables: EnvironmentVariable[],
): string {
  return resolveVariables(text, variables).value;
}

export function resolveVariables(
  text: string,
  variables: EnvironmentVariable[],
): VariableResolution {
  if (!text) return { redacted: text, value: text };
  let value = text;
  let redacted = text;

  for (const variable of variables) {
    if (variable.enabled && variable.key.trim()) {
      const escapedKey = variable.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`{{\\s*${escapedKey}\\s*}}`, 'g');
      value = value.replace(regex, variable.value);
      redacted = redacted.replace(
        regex,
        variable.sensitive ? REDACTED_VALUE : variable.value,
      );
    }
  }
  return { redacted, value };
}

export function redactSensitiveValues(
  text: string,
  variables: EnvironmentVariable[],
): string {
  if (!text) return text;

  let redacted = text;
  for (const variable of variables) {
    if (!variable.sensitive || !variable.value) continue;
    redacted = redacted.split(variable.value).join(REDACTED_VALUE);
  }

  return redacted;
}

export function redactSensitiveData(
  data: unknown,
  variables: EnvironmentVariable[],
): unknown {
  if (typeof data === 'string') {
    return redactSensitiveValues(data, variables);
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, variables));
  }

  if (typeof data === 'object' && data !== null) {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        redactSensitiveData(value, variables),
      ]),
    );
  }

  return data;
}

export function getLockedSensitiveVariableNames(
  texts: string[],
  variables: EnvironmentVariable[],
): string[] {
  const names = new Set<string>();

  for (const variable of variables) {
    if (!variable.enabled || !variable.sensitive || variable.value) continue;
    const trimmedKey = variable.key.trim();
    if (!trimmedKey) continue;

    const escapedKey = trimmedKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`{{\\s*${escapedKey}\\s*}}`);
    if (texts.some((text) => regex.test(text))) {
      names.add(trimmedKey);
    }
  }

  return Array.from(names);
}
