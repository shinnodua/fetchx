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
      while (j < text.length && /\s/.test(text[j])) j++;
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
        if (escaped) escaped = false;
        else if (text[j] === '\\') escaped = true;
        else if (text[j] === '"') break;
        j++;
      }
      tokens.push({
        type: 'string',
        value: text.substring(i, Math.min(j + 1, text.length)),
      });
      i = j + 1;
      continue;
    }

    const numMatch = text
      .substring(i)
      .match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (numMatch) {
      tokens.push({ type: 'number', value: numMatch[0] });
      i += numMatch[0].length;
      continue;
    }

    const wordMatch = text.substring(i).match(/^[a-zA-Z_$][a-zA-Z0-9_$-]*/);
    if (wordMatch) {
      const word = wordMatch[0];
      tokens.push({
        type: ['true', 'false', 'null'].includes(word) ? 'keyword' : 'other',
        value: word,
      });
      i += word.length;
      continue;
    }

    tokens.push({ type: 'other', value: char });
    i++;
  }

  return tokens;
}

/** Inserts missing commas and completes unclosed object and array brackets. */
export function insertCommasAndBalanceBrackets(text: string): string {
  const tokens = tokenize(text);
  const resultTokens: Token[] = [];
  const stack: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    resultTokens.push(token);

    if (token.type === 'punctuation') {
      if (token.value === '{' || token.value === '[') stack.push(token.value);
      else if (token.value === '}' && stack.at(-1) === '{') stack.pop();
      else if (token.value === ']' && stack.at(-1) === '[') stack.pop();
    }

    const isTermination =
      token.type === 'string' ||
      token.type === 'number' ||
      token.type === 'keyword' ||
      (token.type === 'punctuation' &&
        (token.value === '}' || token.value === ']'));
    if (!isTermination) continue;

    let nextNonWhitespaceIndex = i + 1;
    while (
      nextNonWhitespaceIndex < tokens.length &&
      tokens[nextNonWhitespaceIndex].type === 'whitespace'
    ) {
      nextNonWhitespaceIndex++;
    }
    if (nextNonWhitespaceIndex >= tokens.length) continue;

    const nextToken = tokens[nextNonWhitespaceIndex];
    const startsValue =
      nextToken.type === 'string' ||
      nextToken.type === 'number' ||
      nextToken.type === 'keyword' ||
      nextToken.type === 'other' ||
      (nextToken.type === 'punctuation' &&
        (nextToken.value === '{' || nextToken.value === '['));
    if (startsValue && stack.length > 0) {
      resultTokens.push({ type: 'punctuation', value: ',' });
    }
  }

  let repaired = resultTokens.map((token) => token.value).join('');
  while (stack.length > 0) {
    repaired += stack.pop() === '{' ? '}' : ']';
  }
  return repaired;
}
