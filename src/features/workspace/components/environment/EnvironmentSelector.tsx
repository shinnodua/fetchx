import type React from 'react';
import {
  CheckIcon,
  ChevronDownIcon,
  EnvironmentIcon,
} from '../../../../assets/svgs';
import {
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../../../components';
import { useEnvironmentStore } from '../../../../store';

export const EnvironmentSelector: React.FC = () => {
  const {
    environments,
    activeEnvironmentId,
    setActiveEnvironmentId,
    setManageEnvOpen,
  } = useEnvironmentStore();

  const activeEnv = environments.find((e) => e.id === activeEnvironmentId);

  return (
    <DropdownMenu
      align="right"
      className="w-56"
      trigger={
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 rounded-lg text-xs flex items-center gap-1.5 shrink-0 select-none cursor-pointer"
        >
          <EnvironmentIcon
            title="Environment"
            className="w-3.5 h-3.5 text-foreground/45 shrink-0"
          />
          <span className="truncate max-w-[110px]">
            {activeEnv ? activeEnv.name : 'No Environment'}
          </span>
          <ChevronDownIcon
            title="Open environment menu"
            className="w-3 h-3 text-foreground/45 shrink-0"
            strokeWidth={2.5}
          />
        </Button>
      }
    >
      <DropdownMenuItem
        onClick={() => setActiveEnvironmentId(null)}
        className="flex items-center justify-between"
      >
        <span
          className={
            !activeEnvironmentId ? 'font-semibold text-primary-500' : ''
          }
        >
          No Environment
        </span>
        {!activeEnvironmentId && (
          <CheckIcon
            title="Selected environment"
            className="w-4 h-4 text-primary-500"
            strokeWidth={2.5}
          />
        )}
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      {environments.length > 0 && (
        <>
          {environments.map((env) => {
            const isActive = env.id === activeEnvironmentId;
            return (
              <DropdownMenuItem
                key={env.id}
                onClick={() => setActiveEnvironmentId(env.id)}
                className="flex items-center justify-between"
              >
                <span
                  className={isActive ? 'font-semibold text-primary-500' : ''}
                >
                  {env.name}
                </span>
                {isActive && (
                  <CheckIcon
                    title="Selected environment"
                    className="w-4 h-4 text-primary-500"
                    strokeWidth={2.5}
                  />
                )}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
        </>
      )}

      <DropdownMenuItem
        onClick={() => setManageEnvOpen(true)}
        className="text-primary-500 hover:text-primary-600 font-medium"
      >
        Manage Environments...
      </DropdownMenuItem>
    </DropdownMenu>
  );
};
