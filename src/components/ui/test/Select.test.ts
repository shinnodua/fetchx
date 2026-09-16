import { describe, expect, test } from 'bun:test';
import { getSelectTriggerLabel } from '../Select';

describe('Select', () => {
  test('uses its loading label before the selected option', () => {
    expect(
      getSelectTriggerLabel(
        { value: 'gemini-3', label: 'Gemini 3' },
        true,
        'Loading models…',
        'Select a model',
      ),
    ).toBe('Loading models…');
  });
});
