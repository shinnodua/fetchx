import type React from 'react';
import { useEffect, useState } from 'react';
import { EnvironmentIcon } from '../../../../assets/svgs';
import { Button, Dialog, Input } from '../../../../components';
import { useEnvironmentStore } from '../../../../store';
import { EnvironmentList } from './EnvironmentList';
import { PincodePanel } from './PincodePanel';
import { VariablesTable } from './VariablesTable';

export const EnvironmentDialog: React.FC = () => {
  const {
    environments,
    manageEnvOpen,
    setManageEnvOpen,
    addEnvironment,
    deleteEnvironment,
    renameEnvironment,
    clearSensitiveCryptoError,
  } = useEnvironmentStore();

  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
  const [environmentToDeleteId, setEnvironmentToDeleteId] = useState<
    string | null
  >(null);
  const [revealedSensitiveVariableIds, setRevealedSensitiveVariableIds] =
    useState<string[]>([]);

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
    setRevealedSensitiveVariableIds([]);
    clearSensitiveCryptoError();
    setManageEnvOpen(false);
  };

  const handleToggleRevealSensitiveVariable = (id: string) => {
    setRevealedSensitiveVariableIds((ids) =>
      ids.includes(id)
        ? ids.filter((revealedId) => revealedId !== id)
        : [...ids, id],
    );
  };

  const handleRemoveVariableId = (id: string) => {
    setRevealedSensitiveVariableIds((ids) => ids.filter((key) => key !== id));
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
          <EnvironmentList
            environments={environments}
            selectedEnvId={selectedEnvId}
            onSelect={setSelectedEnvId}
            onDeleteClick={handleDeleteEnvironmentClick}
            onAddClick={handleAddEnvironmentClick}
          />

          {/* Right pane: Variables Editor */}
          <div className="flex-1 flex flex-col h-full overflow-hidden p-4 -m-4">
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

                <PincodePanel
                  onLock={() => setRevealedSensitiveVariableIds([])}
                />

                <VariablesTable
                  selectedEnv={selectedEnv}
                  revealedSensitiveVariableIds={revealedSensitiveVariableIds}
                  onToggleRevealSensitiveVariable={
                    handleToggleRevealSensitiveVariable
                  }
                  onRemoveVariableId={handleRemoveVariableId}
                />
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
