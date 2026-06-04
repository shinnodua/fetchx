import type React from 'react';
import {
  EyeIcon,
  EyeOffIcon,
  PlusIcon,
  TrashIcon,
} from '../../../../assets/svgs';
import { Button, Checkbox, Input } from '../../../../components';
import { useEnvironmentStore } from '../../../../store';
import { createId } from '../../../../store/workspace/workspaceStoreUtils';
import type { Environment, EnvironmentVariable } from '../../types';

interface VariablesTableProps {
  selectedEnv: Environment;
  revealedSensitiveVariableIds: string[];
  onToggleRevealSensitiveVariable: (id: string) => void;
  onRemoveVariableId: (id: string) => void;
}

export const VariablesTable: React.FC<VariablesTableProps> = ({
  selectedEnv,
  revealedSensitiveVariableIds,
  onToggleRevealSensitiveVariable,
  onRemoveVariableId,
}) => {
  const { sensitiveUnlocked, updateEnvironmentVariables } =
    useEnvironmentStore();

  const handleVariableChange = (
    index: number,
    fields: Partial<EnvironmentVariable>,
  ) => {
    const updated = [...selectedEnv.variables];
    updated[index] = { ...updated[index], ...fields };
    updateEnvironmentVariables(selectedEnv.id, updated);
  };

  const handleRemoveVariable = (index: number) => {
    const variableToRemove = selectedEnv.variables[index];
    const updated = selectedEnv.variables.filter((_, i) => i !== index);
    if (variableToRemove) {
      onRemoveVariableId(variableToRemove.id);
    }
    updateEnvironmentVariables(selectedEnv.id, updated);
  };

  const handleAddVariable = () => {
    const updated = [
      ...selectedEnv.variables,
      {
        id: createId('v'),
        key: '',
        value: '',
        enabled: true,
        sensitive: false,
      },
    ];
    updateEnvironmentVariables(selectedEnv.id, updated);
  };

  return (
    <div className="flex-grow flex flex-col min-h-0 border border-foreground/10 rounded-xl p-4 bg-foreground/[0.02]">
      <div className="flex items-center gap-3 px-2 pb-3 border-b border-foreground/10 text-xs font-semibold text-foreground/45 uppercase tracking-wider">
        <div className="w-14 text-center shrink-0">Active</div>
        <div className="flex-[1.1]">Variable</div>
        <div className="flex-[1.4]">Value</div>
        <div className="w-20 text-center shrink-0">Sensitive</div>
        <div className="w-8 shrink-0" />
      </div>

      <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 min-h-0">
        {selectedEnv.variables.length === 0 ? (
          <p className="text-xs text-foreground/40 italic text-center py-8">
            No variables defined. Add a variable row below.
          </p>
        ) : (
          selectedEnv.variables.map((variable, idx) => {
            const isSensitiveValueRevealed =
              sensitiveUnlocked &&
              revealedSensitiveVariableIds.includes(variable.id);
            return (
              <div key={variable.id} className="flex items-center gap-2 group">
                <div className="w-14 shrink-0 flex items-center justify-center">
                  <Checkbox
                    checked={variable.enabled}
                    onChange={(e) =>
                      handleVariableChange(idx, {
                        enabled: e.target.checked,
                      })
                    }
                  />
                </div>
                <div className="flex-[1.1]">
                  <Input
                    placeholder="Variable"
                    value={variable.key}
                    onChange={(e) =>
                      handleVariableChange(idx, {
                        key: e.target.value,
                      })
                    }
                    className="h-10 px-3 rounded-lg border-primary-500/25 bg-primary-50/70 text-sm font-semibold placeholder:text-primary-500/55 focus-visible:bg-background dark:bg-primary-900/15"
                  />
                </div>
                <div className="flex-[1.4]">
                  <Input
                    type={
                      variable.sensitive && !isSensitiveValueRevealed
                        ? 'password'
                        : 'text'
                    }
                    placeholder={
                      variable.sensitive &&
                      !sensitiveUnlocked &&
                      variable.encryptedValue
                        ? '••••••••'
                        : 'Value'
                    }
                    value={variable.value}
                    disabled={variable.sensitive && !sensitiveUnlocked}
                    rightIcon={
                      variable.sensitive && sensitiveUnlocked ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() =>
                            onToggleRevealSensitiveVariable(variable.id)
                          }
                          className="h-7 w-7 rounded p-0 text-foreground/45 hover:text-primary-500 cursor-pointer"
                          title={
                            isSensitiveValueRevealed
                              ? 'Hide sensitive value'
                              : 'Reveal sensitive value'
                          }
                        >
                          {isSensitiveValueRevealed ? (
                            <EyeOffIcon
                              title="Hide sensitive value"
                              className="w-4 h-4 shrink-0"
                            />
                          ) : (
                            <EyeIcon
                              title="Reveal sensitive value"
                              className="w-4 h-4 shrink-0"
                            />
                          )}
                        </Button>
                      ) : undefined
                    }
                    onChange={(e) =>
                      handleVariableChange(idx, {
                        value: e.target.value,
                      })
                    }
                    className="h-10 px-3 rounded-lg text-sm"
                  />
                </div>
                <div className="w-20 shrink-0 flex items-center justify-center">
                  <Checkbox
                    checked={variable.sensitive ?? false}
                    disabled={!sensitiveUnlocked}
                    title={
                      sensitiveUnlocked
                        ? 'Mark sensitive'
                        : 'Unlock sensitive values first'
                    }
                    onChange={(e) =>
                      handleVariableChange(idx, {
                        sensitive: e.target.checked,
                      })
                    }
                  />
                </div>
                <div className="w-8 shrink-0 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveVariable(idx)}
                    className="h-7 w-7 rounded p-0 text-foreground/40 hover:text-primary-500 cursor-pointer"
                    title="Remove Variable"
                  >
                    <TrashIcon
                      title="Remove variable"
                      className="w-3.5 h-3.5 shrink-0"
                    />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-3 border-t border-foreground/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddVariable}
          className="h-8 px-2 text-xs text-primary-500 hover:text-primary-600 font-semibold cursor-pointer"
        >
          <PlusIcon
            title="Add variable"
            className="w-3.5 h-3.5 shrink-0"
            strokeWidth={2.5}
          />
          Add Variable
        </Button>
      </div>
    </div>
  );
};
