import type React from 'react';
import { useEffect, useState } from 'react';
import { EnvironmentIcon, PlusIcon, TrashIcon } from '../../../assets/svgs';
import { Button, Checkbox, Dialog, Input } from '../../../components';
import { useEnvironmentStore } from '../../../store/useEnvironmentStore';
import { createId } from '../../../store/workspaceStoreUtils';
import type { EnvironmentVariable } from '../types';

export const EnvironmentDialog: React.FC = () => {
  const {
    environments,
    manageEnvOpen,
    setManageEnvOpen,
    addEnvironment,
    deleteEnvironment,
    renameEnvironment,
    updateEnvironmentVariables,
  } = useEnvironmentStore();

  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
  const [environmentToDeleteId, setEnvironmentToDeleteId] = useState<
    string | null
  >(null);

  // Auto-select the newly added or last environment if none or invalid is selected
  useEffect(() => {
    if (environments.length > 0) {
      if (!selectedEnvId || !environments.some((e) => e.id === selectedEnvId)) {
        setSelectedEnvId(environments[environments.length - 1].id);
      }
    } else {
      setSelectedEnvId(null);
    }
  }, [environments, selectedEnvId]);

  const selectedEnv = environments.find((e) => e.id === selectedEnvId);
  const environmentToDelete = environments.find(
    (e) => e.id === environmentToDeleteId,
  );

  const handleVariableChange = (
    index: number,
    fields: Partial<EnvironmentVariable>,
  ) => {
    if (!selectedEnv) return;
    const updated = [...selectedEnv.variables];
    updated[index] = { ...updated[index], ...fields };
    updateEnvironmentVariables(selectedEnv.id, updated);
  };

  const handleRemoveVariable = (index: number) => {
    if (!selectedEnv) return;
    const updated = selectedEnv.variables.filter((_, i) => i !== index);
    updateEnvironmentVariables(selectedEnv.id, updated);
  };

  const handleAddVariable = () => {
    if (!selectedEnv) return;
    const updated = [
      ...selectedEnv.variables,
      { id: createId('v'), key: '', value: '', enabled: true },
    ];
    updateEnvironmentVariables(selectedEnv.id, updated);
  };

  const handleAddEnvironmentClick = () => {
    addEnvironment('New Environment');
  };

  const handleDeleteEnvironmentClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEnvironmentToDeleteId(id);
  };

  const handleConfirmDeleteEnvironment = () => {
    if (!environmentToDeleteId) return;
    deleteEnvironment(environmentToDeleteId);
    setEnvironmentToDeleteId(null);
  };

  const handleCancelDeleteEnvironment = () => {
    setEnvironmentToDeleteId(null);
  };

  const handleManageEnvironmentClose = () => {
    setEnvironmentToDeleteId(null);
    setManageEnvOpen(false);
  };

  return (
    <>
      <Dialog
        isOpen={manageEnvOpen}
        onClose={handleManageEnvironmentClose}
        title="Manage Environments"
        description="Define environment-specific variables. Use them in your request target URLs, contract addresses, query parameters, body, headers, or arguments as {{variable_name}}."
        className="w-[min(calc(100vw-2rem),1180px)] max-w-none"
      >
        <div className="flex flex-col md:flex-row gap-6 h-[min(640px,calc(100vh-10rem))] mt-4 min-h-0 select-none">
          {/* Left pane: Environments List */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-foreground/10 pb-4 md:pb-0 md:pr-5 flex flex-col justify-between h-40 md:h-full shrink-0">
            <div className="flex-1 flex flex-col min-h-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground/45 mb-2 block">
                Environments
              </span>
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {environments.length === 0 ? (
                  <p className="text-xs text-foreground/40 italic py-4">
                    No environments.
                  </p>
                ) : (
                  environments.map((env) => {
                    const isSelected = env.id === selectedEnvId;
                    return (
                      <div
                        key={env.id}
                        onClick={() => setSelectedEnvId(env.id)}
                        className={`flex items-center justify-between gap-2 p-2 rounded-xl text-xs cursor-pointer group transition-all ${
                          isSelected
                            ? 'bg-primary-500/10 font-semibold text-primary-500 border border-primary-500/20'
                            : 'text-foreground/75 hover:bg-foreground/5 hover:text-foreground border border-transparent'
                        }`}
                      >
                        <span className="truncate">{env.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) =>
                            handleDeleteEnvironmentClick(env.id, e)
                          }
                          className="h-5 w-5 rounded p-0 text-foreground/40 hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete Environment"
                        >
                          <TrashIcon
                            title="Delete environment"
                            className="w-3 h-3"
                          />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddEnvironmentClick}
              className="w-full flex items-center justify-center gap-1.5 text-xs py-2 mt-4 cursor-pointer"
            >
              <PlusIcon
                title="Add environment"
                className="w-3.5 h-3.5"
                strokeWidth={2.5}
              />
              Add Environment
            </Button>
          </div>

          {/* Right pane: Variables Editor */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {!selectedEnv ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <EnvironmentIcon
                  title="No environment selected"
                  className="w-12 h-12 text-foreground/20 mb-3"
                  strokeWidth={1.5}
                />
                <p className="text-sm font-medium text-foreground/50">
                  Select or create an environment to manage variables.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full min-h-0">
                <div className="mb-4">
                  <Input
                    label="Environment Name"
                    placeholder="e.g. Production, Rinkeby"
                    value={selectedEnv.name}
                    onChange={(e) =>
                      renameEnvironment(selectedEnv.id, e.target.value)
                    }
                    className="h-10 rounded-xl"
                  />
                </div>

                <div className="flex-1 flex flex-col min-h-0 border border-foreground/10 rounded-xl p-4 bg-foreground/[0.02]">
                  <div className="flex items-center gap-3 px-2 pb-3 border-b border-foreground/10 text-xs font-semibold text-foreground/45 uppercase tracking-wider">
                    <div className="w-14 text-center shrink-0">Active</div>
                    <div className="flex-[1.1]">Variable</div>
                    <div className="flex-[1.4]">Value</div>
                    <div className="w-8 shrink-0" />
                  </div>

                  <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 min-h-0">
                    {selectedEnv.variables.length === 0 ? (
                      <p className="text-xs text-foreground/40 italic text-center py-8">
                        No variables defined. Add a variable row below.
                      </p>
                    ) : (
                      selectedEnv.variables.map((variable, idx) => {
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
                                placeholder="Value"
                                value={variable.value}
                                onChange={(e) =>
                                  handleVariableChange(idx, {
                                    value: e.target.value,
                                  })
                                }
                                className="h-10 px-3 rounded-lg text-sm"
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
                                  className="w-3.5 h-3.5"
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
                        className="w-3.5 h-3.5"
                        strokeWidth={2.5}
                      />
                      Add Variable
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-foreground/10 mt-4 select-none">
          <Button
            variant="primary"
            onClick={handleManageEnvironmentClose}
            className="cursor-pointer"
          >
            Done
          </Button>
        </div>
      </Dialog>

      <Dialog
        isOpen={Boolean(environmentToDelete)}
        onClose={handleCancelDeleteEnvironment}
        title="Delete Environment"
        description={
          environmentToDelete
            ? `Are you sure you want to delete "${environmentToDelete.name}"? This will remove its variables and cannot be undone.`
            : undefined
        }
        className="max-w-md"
      >
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleCancelDeleteEnvironment}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmDeleteEnvironment}
            className="cursor-pointer"
          >
            Delete
          </Button>
        </div>
      </Dialog>
    </>
  );
};
