import type { EnvironmentVariable } from '../types';

export function replaceVariables(
  text: string,
  variables: EnvironmentVariable[],
): string {
  if (!text) return text;
  let result = text;
  for (const variable of variables) {
    if (variable.enabled && variable.key.trim()) {
      const escapedKey = variable.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`{{\\s*${escapedKey}\\s*}}`, 'g');
      result = result.replace(regex, variable.value);
    }
  }
  return result;
}
