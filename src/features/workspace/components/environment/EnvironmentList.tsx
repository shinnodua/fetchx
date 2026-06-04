import type React from 'react';
import { PlusIcon, TrashIcon } from '../../../../assets/svgs';
import { Button } from '../../../../components';
import type { Environment } from '../../types';

interface EnvironmentListProps {
  environments: Environment[];
  selectedEnvId: string | null;
  onSelect: (id: string) => void;
  onDeleteClick: (id: string, e: React.MouseEvent) => void;
  onAddClick: () => void;
}

export const EnvironmentList: React.FC<EnvironmentListProps> = ({
  environments,
  selectedEnvId,
  onSelect,
  onDeleteClick,
  onAddClick,
}) => {
  return (
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
                  onClick={() => onSelect(env.id)}
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
                    onClick={(e) => onDeleteClick(env.id, e)}
                    className="h-5 w-5 rounded p-0 text-foreground/40 hover:text-primary-500 transition-opacity"
                    title="Delete Environment"
                  >
                    <TrashIcon
                      title="Delete environment"
                      className="w-3 h-3 shrink-0"
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
        onClick={onAddClick}
        className="w-full flex items-center justify-center gap-1.5 text-xs py-2 mt-4 cursor-pointer"
      >
        <PlusIcon
          title="Add environment"
          className="w-3.5 h-3.5 shrink-0"
          strokeWidth={2.5}
        />
        Add Environment
      </Button>
    </div>
  );
};
