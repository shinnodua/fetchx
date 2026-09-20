/**
 * Determines whether an input is a list of key-value pairs without wrapping
 * braces, while ignoring colons inside strings and comments.
 */
export function shouldWrapInBraces(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return false;
  }

  let inString = false;
  let quoteChar = '';
  let escaped = false;
  let i = 0;

  while (i < trimmed.length) {
    const char = trimmed[i];
    if (escaped) {
      escaped = false;
      i++;
      continue;
    }
    if (char === '\\' && inString) {
      escaped = true;
      i++;
      continue;
    }
    if (inString) {
      if (
        char === quoteChar ||
        (quoteChar === '“' && char === '”') ||
        (quoteChar === '‘' && char === '’')
      ) {
        inString = false;
      }
      i++;
    } else if (char === '"' || char === "'" || char === '“' || char === '‘') {
      inString = true;
      quoteChar = char;
      i++;
    } else if (char === '/' && trimmed[i + 1] === '/') {
      i += 2;
      while (i < trimmed.length && trimmed[i] !== '\n' && trimmed[i] !== '\r') {
        i++;
      }
    } else if (char === '/' && trimmed[i + 1] === '*') {
      i += 2;
      while (
        i < trimmed.length &&
        !(trimmed[i] === '*' && trimmed[i + 1] === '/')
      ) {
        i++;
      }
      i += 2;
    } else if (char === ':') {
      return true;
    } else {
      i++;
    }
  }

  return false;
}
