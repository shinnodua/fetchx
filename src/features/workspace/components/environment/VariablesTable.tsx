import type React from 'react';
import {
  EyeIcon,
  EyeOffIcon,
  PlusIcon,
  TrashIcon,
} from '../../../../assets/svgs';
import { Button, Checkbox, Input } from '../../../../components';
import { trackEvent } from '../../../../services/analytics/googleAnalytics';
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
    <div className="flex min-h-0 flex-grow flex-col overflow-x-auto rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3">
      <div className="min-w-[480px] flex-grow flex flex-col min-h-0">
        <div className="flex items-center gap-2 border-b border-foreground/10 px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-foreground/45">
          <div className="w-14 text-center shrink-0">Active</div>
          <div className="flex-[1.1]">Variable</div>
          <div className="flex-[1.4]">Value</div>
          <div className="w-20 text-center shrink-0">Sensitive</div>
          <div className="w-8 shrink-0" />
        </div>

        <div className="flex min-h-0 flex-1 space-y-2 overflow-y-auto py-2 pr-1">
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
                <div
                  key={variable.id}
                  className="flex items-center gap-2 group"
                >
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
                      onClick={() => {
                        trackEvent({
                          screen: 'environments',
                          action: 'remove_variable',
                        });
                        handleRemoveVariable(idx);
                      }}
                      className="h-7 w-7 rounded p-0 text-foreground/40 hover:text-primary-500 cursor-pointer"
                      title="Remove Variable"
                    >
                      <TrashIcon
                        title="Remove variable"
                        className="w-3.5 h-3.5 shrink-0"
                        strokeWidth={1.5}
                      />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-foreground/10 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              trackEvent({ screen: 'environments', action: 'add_variable' });
              handleAddVariable();
            }}
            className="h-8 px-2 text-xs text-primary-500 hover:text-primary-600 font-semibold cursor-pointer"
          >
            <PlusIcon
              title="Add variable"
              className="w-3.5 h-3.5 shrink-0 mr-1"
              strokeWidth={2}
            />
            Add Variable
          </Button>
        </div>
      </div>
    </div>
  );
};
