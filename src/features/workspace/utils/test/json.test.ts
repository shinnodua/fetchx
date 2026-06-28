import { describe, expect, test } from 'bun:test';

import { beautifyJson, repairJson } from '../json';

describe('JSON repair utilities', () => {
  test('repairs common object syntax issues', () => {
    expect(
      JSON.parse(
        repairJson(`
          // comment
          name: 'Call3',
          enabled: true,
          missing: undefined,
        `),
      ),
    ).toEqual({
      name: 'Call3',
      enabled: true,
      missing: null,
    });
  });

  test('keeps environment placeholders valid outside strings', () => {
    expect(repairJson('{ token: {{TOKEN}}, url: "{{API_URL}}" }')).toBe(
      '{ "token": {{TOKEN}}, "url": "{{API_URL}}" }',
    );
  });

  test('beautifies repaired JSON while restoring placeholders', () => {
    expect(beautifyJson('{name:"Call3",token:{{TOKEN}},items:[1,2,],}')).toBe(
      '{\n  "name": "Call3",\n  "token": {{TOKEN}},\n  "items": [\n    1,\n    2\n  ]\n}',
    );
  });

  test('returns empty strings for empty input', () => {
    expect(repairJson('   ')).toBe('');
    expect(beautifyJson('   ')).toBe('');
  });
});
