import type React from 'react';
import { useState } from 'react';
import { TrashIcon } from '../../../../../assets/svgs';
import { Button } from '../../../../../components';
import { EnvironmentAwareInput } from '../../environment/EnvironmentAwareField';

interface JsonUiEditorProps {
  body: string | undefined;
  onChange: (body: string) => void;
}

export const JsonUiEditor: React.FC<JsonUiEditorProps> = ({
  body,
  onChange,
}) => {
  const [pairs, setPairs] = useState<
    { id: string; key: string; value: string }[]
  >(() => {
    try {
      const parsed = JSON.parse(body || '{}');
      return Object.entries(parsed).map(([k, v]) => ({
        id: crypto.randomUUID(),
        key: k,
        value: typeof v === 'object' ? JSON.stringify(v) : String(v),
      }));
    } catch {
      return [];
    }
  });

  const updateBody = (newPairs: typeof pairs) => {
    setPairs(newPairs);

    const obj: Record<string, unknown> = {};
    for (const p of newPairs) {
      if (!p.key && !p.value) continue; // Skip completely empty pairs

      let parsedValue: unknown = p.value;
      try {
        if (p.value !== '') {
          // If it matches exactly a boolean, number, or JSON object/array
          if (
            p.value === 'true' ||
            p.value === 'false' ||
            p.value === 'null' ||
            !Number.isNaN(Number(p.value)) ||
            (p.value.startsWith('{') && p.value.endsWith('}')) ||
            (p.value.startsWith('[') && p.value.endsWith(']'))
          ) {
            parsedValue = JSON.parse(p.value);
          }
        }
      } catch {
        // Leave as string if not valid JSON
        parsedValue = p.value;
      }
      obj[p.key] = parsedValue;
    }

    onChange(JSON.stringify(obj, null, 2));
  };

  const handleAdd = () => {
    updateBody([...pairs, { id: crypto.randomUUID(), key: '', value: '' }]);
  };

  const handleRemove = (id: string) => {
    updateBody(pairs.filter((p) => p.id !== id));
  };

  const handleChange = (
    id: string,
    field: 'key' | 'value',
    newValue: string,
  ) => {
    updateBody(
      pairs.map((p) => (p.id === id ? { ...p, [field]: newValue } : p)),
    );
  };

  return (
    <div className="space-y-3">
      {pairs.map((pair) => (
        <div key={pair.id} className="flex gap-2 items-center">
          <EnvironmentAwareInput
            placeholder="Key"
            value={pair.key}
            onChange={(e) => handleChange(pair.id, 'key', e.target.value)}
          />
          <EnvironmentAwareInput
            placeholder="Value"
            value={pair.value}
            onChange={(e) => handleChange(pair.id, 'value', e.target.value)}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRemove(pair.id)}
            className="h-9 w-9 rounded p-0 text-primary-500/60 hover:text-primary-500 mt-0 shrink-0 flex items-center justify-center"
            title="Remove field"
          >
            <TrashIcon title="Remove field" className="w-4 h-4 shrink-0" />
          </Button>
        </div>
      ))}
      <div className="flex justify-end mt-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-[10px] rounded-lg"
          onClick={handleAdd}
        >
          + Add Field
        </Button>
      </div>
      {pairs.length === 0 && (
        <p className="text-xs text-foreground/50 italic py-2 text-center">
          No fields added yet. Add a field to start building your JSON.
        </p>
      )}
    </div>
  );
};
