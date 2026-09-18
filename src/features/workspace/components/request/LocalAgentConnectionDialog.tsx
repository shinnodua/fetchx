import type React from 'react';
import { CheckSolidIcon, InfoIcon } from '../../../../assets/svgs';
import {
  Alert,
  Badge,
  Button,
  Dialog,
  Select,
  Skeleton,
} from '../../../../components';
import type {
  LocalAiAgent,
  LocalAiAgentModel,
} from '../../../../services/platform';
import {
  getLocalAiAgentLabel,
  getLocalAiAgentModelOptions,
} from '../../utils/localAiAgent';

interface LocalAgentConnectionDialogProps {
  agents: LocalAiAgent[];
  error: string | null;
  isDesktop: boolean;
  isDiscovering: boolean;
  isOpen: boolean;
  isLoadingModels: boolean;
  modelError: string | null;
  models: LocalAiAgentModel[];
  selectedAgentId: string;
  selectedModelId: string;
  onClose: () => void;
  onConnect: (agentId: string) => void;
  onModelChange: (modelId: string) => void;
  onRefresh: () => void;
}

const AgentListSkeleton = () => (
  <div className="overflow-hidden rounded-xl border border-foreground/10">
    {[1, 2].map((item) => (
      <div
        key={item}
        className="flex items-center justify-between gap-4 border-b border-foreground/10 p-4 last:border-b-0"
      >
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48 max-w-full" />
        </div>
        <Skeleton className="h-9 w-20 shrink-0 rounded-xl" />
      </div>
    ))}
  </div>
);

export const LocalAgentConnectionDialog: React.FC<
  LocalAgentConnectionDialogProps
> = ({
  agents,
  error,
  isDesktop,
  isDiscovering,
  isOpen,
  isLoadingModels,
  modelError,
  models,
  selectedAgentId,
  selectedModelId,
  onClose,
  onConnect,
  onModelChange,
  onRefresh,
}) => (
  <Dialog
    isOpen={isOpen}
    onClose={onClose}
    title="Connect a local agent"
    description="Choose a detected local service or an installed AI CLI."
    className="max-w-xl"
  >
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">
            Available agents
          </p>
          <p className="mt-1 text-xs leading-5 text-foreground/55">
            CLI agents run with the permissions configured in their own tools.
            Only connect one you trust.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          isLoading={isDiscovering}
          disabled={!isDesktop}
          className="shrink-0 border border-foreground/10"
        >
          Refresh
        </Button>
      </div>

      {!isDesktop ? (
        <Alert
          title="Open Fetchx Desktop"
          icon={<InfoIcon title="Desktop app required" className="h-5 w-5" />}
        >
          Local agents run on your computer and can only be connected from the
          desktop app.
        </Alert>
      ) : error ? (
        <Alert
          variant="destructive"
          title="Detection failed"
          icon={<InfoIcon title="Agent detection failed" className="h-5 w-5" />}
        >
          {error}
        </Alert>
      ) : isDiscovering ? (
        <AgentListSkeleton />
      ) : agents.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-xl border border-foreground/10">
            {agents.map((agent) => {
              const isSelected = agent.id === selectedAgentId;
              return (
                <div
                  key={agent.id}
                  className="flex items-center justify-between gap-4 border-b border-foreground/10 p-4 last:border-b-0"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">
                        {agent.name}
                      </p>
                      <Badge
                        variant={agent.kind === 'cli' ? 'primary' : 'ghost'}
                      >
                        {agent.kind === 'cli' ? 'CLI' : 'Local service'}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-foreground/50">
                      {getLocalAiAgentLabel(agent)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={isSelected ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => onConnect(agent.id)}
                    disabled={isSelected}
                    className="min-w-24 shrink-0"
                  >
                    {isSelected && (
                      <CheckSolidIcon
                        title="Connected"
                        className="mr-1.5 h-4 w-4"
                      />
                    )}
                    {isSelected ? 'Connected' : 'Connect'}
                  </Button>
                </div>
              );
            })}
          </div>
          {selectedAgentId && (
            <>
              <Select
                label="Model"
                value={selectedModelId}
                options={getLocalAiAgentModelOptions(models)}
                placeholder="Use agent default model"
                onChange={onModelChange}
                disabled={isLoadingModels}
                isLoading={isLoadingModels}
                loadingLabel="Loading models…"
              />
              {modelError && !isLoadingModels && (
                <p className="text-xs text-destructive" role="status">
                  {modelError}
                </p>
              )}
            </>
          )}
        </>
      ) : (
        <Alert
          title="No supported agents found"
          icon={<InfoIcon title="No agents found" className="h-5 w-5" />}
        >
          Install a supported CLI or start a local model service such as Ollama
          or LM Studio, then select Refresh.
        </Alert>
      )}

      <div className="flex justify-end border-t border-foreground/10 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  </Dialog>
);
