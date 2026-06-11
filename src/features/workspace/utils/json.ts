/**
 * Helper to determine if a raw text input represents a list of key-value pairs
 * without the wrapping curly braces.
 */
function shouldWrapInBraces(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return false;
  }

  // Scan character-by-character to detect a top-level colon outside strings and comments.
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
    } else {
      if (char === '"' || char === "'" || char === '“' || char === '‘') {
        inString = true;
        quoteChar = char;
        i++;
      } else if (char === '/' && trimmed[i + 1] === '/') {
        i += 2;
        while (
          i < trimmed.length &&
          trimmed[i] !== '\n' &&
          trimmed[i] !== '\r'
        ) {
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
  }

  return false;
}

/**
 * Temporarily extracts environment variable placeholders like {{variable}}
 * from outside of JSON strings, replacing them with a quoted placeholder
 * key so they do not break JSON syntax parsing.
 */
function extractEnvVars(text: string): {
  repairedText: string;
  placeholders: Record<string, string>;
} {
  let inString = false;
  let quoteChar = '';
  let escaped = false;
  let i = 0;
  let output = '';
  const placeholders: Record<string, string> = {};
  let placeholderCount = 0;

  while (i < text.length) {
    const char = text[i];
    if (escaped) {
      output += char;
      escaped = false;
      i++;
      continue;
    }
    if (char === '\\' && inString) {
      output += char;
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
      output += char;
      i++;
    } else {
      if (char === '"' || char === "'" || char === '“' || char === '‘') {
        inString = true;
        quoteChar = char;
        output += char;
        i++;
      } else if (char === '{' && text[i + 1] === '{') {
        let j = i + 2;
        let bracketsCount = 2;
        while (j < text.length) {
          if (text[j] === '}' && text[j + 1] === '}') {
            bracketsCount = 0;
            break;
          }
          j++;
        }
        if (bracketsCount === 0) {
          const original = text.substring(i, j + 2);
          const placeholderKey = `__ENV_VAR_PLACEHOLDER_${placeholderCount}__`;
          placeholderCount++;
          placeholders[placeholderKey] = original;
          output += `"${placeholderKey}"`;
          i = j + 2;
        } else {
          output += char;
          i++;
        }
      } else {
        output += char;
        i++;
      }
    }
  }

  return { repairedText: output, placeholders };
}

/**
 * Strips both line and block comments from outside string literals.
 */
function stripComments(text: string): string {
  let inString = false;
  let quoteChar = '';
  let escaped = false;
  let i = 0;
  let output = '';

  while (i < text.length) {
    const char = text[i];
    if (escaped) {
      output += char;
      escaped = false;
      i++;
      continue;
    }
    if (char === '\\' && inString) {
      output += char;
      escaped = true;
      i++;
      continue;
    }
    if (inString) {
      if (char === quoteChar) {
        inString = false;
      }
      output += char;
      i++;
    } else {
      if (char === '"' || char === "'") {
        inString = true;
        quoteChar = char;
        output += char;
        i++;
      } else if (char === '/' && text[i + 1] === '/') {
        i += 2;
        while (i < text.length && text[i] !== '\n' && text[i] !== '\r') {
          i++;
        }
      } else if (char === '/' && text[i + 1] === '*') {
        i += 2;
        while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) {
          i++;
        }
        i += 2;
      } else {
        output += char;
        i++;
      }
    }
  }

  return output;
}

/**
 * Normalizes smart quotes and single-quoted string literals to standard
 * double-quoted JSON strings, converting escape characters appropriately.
 */
function normalizeQuotes(text: string): string {
  let i = 0;
  let output = '';

  while (i < text.length) {
    const char = text[i];
    if (
      char === '"' ||
      char === "'" ||
      char === '“' ||
      char === '”' ||
      char === '‘' ||
      char === '’'
    ) {
      const startQuote = char;
      const endQuoteCandidates =
        startQuote === '“' || startQuote === '”'
          ? ['“', '”']
          : startQuote === '‘' || startQuote === '’'
            ? ['‘', '’']
            : [startQuote];

      let j = i + 1;
      let strContent = '';
      let escaped = false;

      while (j < text.length) {
        const c = text[j];
        if (escaped) {
          strContent += `\\${c}`;
          escaped = false;
          j++;
          continue;
        }
        if (c === '\\') {
          escaped = true;
          j++;
          continue;
        }
        if (endQuoteCandidates.includes(c)) {
          break;
        }
        strContent += c;
        j++;
      }

      let processedStr = '';
      let k = 0;
      while (k < strContent.length) {
        if (strContent[k] === '\\') {
          const next = strContent[k + 1];
          if (next === "'") {
            processedStr += "'"; // Unescape escaped single quotes
            k += 2;
          } else if (next === '"') {
            processedStr += '\\"'; // Retain escaped double quotes
            k += 2;
          } else {
            processedStr += `\\${next || ''}`;
            k += 2;
          }
        } else if (strContent[k] === '"') {
          processedStr += '\\"'; // Escape unescaped double quotes inside
          k++;
        } else {
          processedStr += strContent[k];
          k++;
        }
      }

      output += `"${processedStr}"`;
      i = j + 1;
    } else {
      output += char;
      i++;
    }
  }

  return output;
}

/**
 * Quotes keys that are unquoted, and maps JavaScript specific literals
 * like undefined and NaN to null.
 */
function quoteUnquotedKeysAndSpecialValues(text: string): string {
  let i = 0;
  let output = '';

  while (i < text.length) {
    const char = text[i];
    if (char === '"') {
      let j = i + 1;
      let escaped = false;
      while (j < text.length) {
        if (escaped) {
          escaped = false;
        } else if (text[j] === '\\') {
          escaped = true;
        } else if (text[j] === '"') {
          break;
        }
        j++;
      }
      output += text.substring(i, Math.min(j + 1, text.length));
      i = j + 1;
    } else {
      const keyRegex = /^[a-zA-Z0-9_$-]+/;
      const match = text.substring(i).match(keyRegex);
      if (match) {
        const word = match[0];
        let nextIdx = i + word.length;
        while (nextIdx < text.length && /\s/.test(text[nextIdx])) {
          nextIdx++;
        }

        if (text[nextIdx] === ':') {
          output += `"${word}"`;
          i = i + word.length;
          continue;
        }

        if (word === 'undefined' || word === 'NaN') {
          output += 'null';
          i = i + word.length;
          continue;
        }
      }
      output += char;
      i++;
    }
  }

  return output;
}

/**
 * Removes trailing commas from arrays or objects.
 */
function cleanTrailingCommas(text: string): string {
  let i = 0;
  let output = '';

  while (i < text.length) {
    const char = text[i];
    if (char === '"') {
      let j = i + 1;
      let escaped = false;
      while (j < text.length) {
        if (escaped) {
          escaped = false;
        } else if (text[j] === '\\') {
          escaped = true;
        } else if (text[j] === '"') {
          break;
        }
        j++;
      }
      output += text.substring(i, j + 1);
      i = j + 1;
    } else if (char === ',') {
      let j = i + 1;
      while (j < text.length && /\s/.test(text[j])) {
        j++;
      }
      if (text[j] === '}' || text[j] === ']') {
        i = j;
      } else {
        output += char;
        i++;
      }
    } else {
      output += char;
      i++;
    }
  }

  return output;
}

interface Token {
  type:
    | 'string'
    | 'number'
    | 'keyword'
    | 'punctuation'
    | 'whitespace'
    | 'other';
  value: string;
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (/\s/.test(char)) {
      let j = i;
      while (j < text.length && /\s/.test(text[j])) {
        j++;
      }
      tokens.push({ type: 'whitespace', value: text.substring(i, j) });
      i = j;
      continue;
    }

    if (['{', '}', '[', ']', ':', ','].includes(char)) {
      tokens.push({ type: 'punctuation', value: char });
      i++;
      continue;
    }

    if (char === '"') {
      let j = i + 1;
      let escaped = false;
      while (j < text.length) {
        if (escaped) {
          escaped = false;
        } else if (text[j] === '\\') {
          escaped = true;
        } else if (text[j] === '"') {
          break;
        }
        j++;
      }
      tokens.push({
        type: 'string',
        value: text.substring(i, Math.min(j + 1, text.length)),
      });
      i = j + 1;
      continue;
    }

    const numRegex = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/;
    const numMatch = text.substring(i).match(numRegex);
    if (numMatch) {
      tokens.push({ type: 'number', value: numMatch[0] });
      i += numMatch[0].length;
      continue;
    }

    const wordRegex = /^[a-zA-Z_$][a-zA-Z0-9_$-]*/;
    const wordMatch = text.substring(i).match(wordRegex);
    if (wordMatch) {
      const word = wordMatch[0];
      const type = ['true', 'false', 'null'].includes(word)
        ? 'keyword'
        : 'other';
      tokens.push({ type, value: word });
      i += word.length;
      continue;
    }

    tokens.push({ type: 'other', value: char });
    i++;
  }

  return tokens;
}

/**
 * Tokenizes the text, inserts missing commas between consecutive JSON values,
 * and tracks the brace/bracket stack to balance any missing ones at the end.
 */
function insertCommasAndBalanceBrackets(text: string): string {
  const tokens = tokenize(text);
  const resultTokens: Token[] = [];
  const stack: string[] = [];

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    resultTokens.push(token);

    if (token.type === 'punctuation') {
      if (token.value === '{' || token.value === '[') {
        stack.push(token.value);
      } else if (token.value === '}') {
        if (stack[stack.length - 1] === '{') {
          stack.pop();
        }
      } else if (token.value === ']') {
        if (stack[stack.length - 1] === '[') {
          stack.pop();
        }
      }
    }

    const isTermination =
      token.type === 'string' ||
      token.type === 'number' ||
      token.type === 'keyword' ||
      (token.type === 'punctuation' &&
        (token.value === '}' || token.value === ']'));

    if (isTermination) {
      let nextNonWsIdx = i + 1;
      while (
        nextNonWsIdx < tokens.length &&
        tokens[nextNonWsIdx].type === 'whitespace'
      ) {
        nextNonWsIdx++;
      }

      if (nextNonWsIdx < tokens.length) {
        const nextToken = tokens[nextNonWsIdx];
        const isStart =
          nextToken.type === 'string' ||
          nextToken.type === 'number' ||
          nextToken.type === 'keyword' ||
          (nextToken.type === 'punctuation' &&
            (nextToken.value === '{' || nextToken.value === '[')) ||
          nextToken.type === 'other';

        if (isStart) {
          if (stack.length > 0) {
            resultTokens.push({ type: 'punctuation', value: ',' });
          }
        }
      }
    }
    i++;
  }

  let repaired = resultTokens.map((t) => t.value).join('');

  while (stack.length > 0) {
    const last = stack.pop();
    if (last === '{') {
      repaired += '}';
    } else if (last === '[') {
      repaired += ']';
    }
  }

  return repaired;
}

/**
 * Restores the environment variable placeholders by substituting them
 * back into the final string.
 */
function restorePlaceholders(
  text: string,
  placeholders: Record<string, string>,
): string {
  let result = text;
  for (const [placeholder, original] of Object.entries(placeholders)) {
    result = result.replaceAll(`"${placeholder}"`, original);
    result = result.replaceAll(placeholder, original);
  }
  return result;
}

/**
 * Attempts to repair common JSON syntax errors before parsing/formatting.
 */
export function repairJson(text: string): string {
  let processed = text.trim();
  if (!processed) {
    return '';
  }

  if (shouldWrapInBraces(processed)) {
    processed = `{${processed}}`;
  }

  const { repairedText, placeholders } = extractEnvVars(processed);
  processed = repairedText;

  processed = stripComments(processed);
  processed = normalizeQuotes(processed);
  processed = quoteUnquotedKeysAndSpecialValues(processed);
  processed = cleanTrailingCommas(processed);
  processed = insertCommasAndBalanceBrackets(processed);
  processed = restorePlaceholders(processed, placeholders);

  return processed;
}

/**
 * Repairs a JSON-like string and formats it cleanly with standard JSON spacing.
 * Throws an error if the repaired JSON is still invalid.
 */
export function beautifyJson(text: string): string {
  let processed = text.trim();
  if (!processed) {
    return '';
  }

  if (shouldWrapInBraces(processed)) {
    processed = `{${processed}}`;
  }

  const { repairedText, placeholders } = extractEnvVars(processed);
  processed = repairedText;

  processed = stripComments(processed);
  processed = normalizeQuotes(processed);
  processed = quoteUnquotedKeysAndSpecialValues(processed);
  processed = cleanTrailingCommas(processed);
  processed = insertCommasAndBalanceBrackets(processed);

  // At this stage, all placeholders are represented as valid double-quoted string literals,
  // making it valid JSON. We parse and format it before restoring the placeholders.
  const parsed = JSON.parse(processed);
  const formatted = JSON.stringify(parsed, null, 2);

  // Restore the placeholders into the formatted JSON string.
  return restorePlaceholders(formatted, placeholders);
}
