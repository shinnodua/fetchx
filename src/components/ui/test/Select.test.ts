import { describe, expect, test } from 'bun:test';
import { getSelectTriggerLabel, type SelectProps } from '../Select';

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

  test('supports a trigger label class for contextual select colors', () => {
    const triggerLabelClassName: SelectProps['triggerLabelClassName'] =
      'text-secondary-600';
    expect(triggerLabelClassName).toBe('text-secondary-600');
  });
});
