import type React from 'react';
import {
  Input,
  type InputProps,
  Textarea,
  type TextareaProps,
} from '../../../components';
import { useEnvironmentStore } from '../../../store/useEnvironmentStore';
import type { EnvironmentVariable } from '../types';

const VARIABLE_TOKEN_REGEX = /{{\s*([^{}\s]+)\s*}}/g;

function getVariableLookup(variables: EnvironmentVariable[]) {
  return new Map(
    variables
      .filter((variable) => variable.enabled && variable.key.trim())
      .map((variable) => [variable.key.trim(), variable.value]),
  );
}

function getEnvironmentValue(
  variableName: string,
  variableLookup: Map<string, string>,
) {
  return variableLookup.get(variableName.trim());
}

function renderEnvironmentHighlights(
  value: string,
  variableLookup: Map<string, string>,
) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  VARIABLE_TOKEN_REGEX.lastIndex = 0;

  for (const match of value.matchAll(VARIABLE_TOKEN_REGEX)) {
    const token = match[0];
    const variableName = match[1];
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      parts.push(value.slice(lastIndex, matchIndex));
    }

    const resolvedValue = getEnvironmentValue(variableName, variableLookup);
    const tooltipText = `${token} = ${
      resolvedValue ?? 'Not set in active environment'
    }`;
    parts.push(
      <span
        key={`${matchIndex}-${token}`}
        className={`pointer-events-auto relative inline cursor-help underline decoration-dotted underline-offset-4 ${
          resolvedValue === undefined
            ? 'text-primary-700 decoration-primary-500 dark:text-primary-200'
            : 'text-secondary-800 decoration-secondary-500 dark:text-secondary-200'
        } group/env-token`}
      >
        {token}
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-max min-w-max max-w-[calc(100vw-4rem)] -translate-x-1/2 whitespace-pre rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background shadow-lg group-hover/env-token:block">
          {tooltipText}
        </span>
      </span>,
    );

    lastIndex = matchIndex + token.length;
  }

  if (lastIndex < value.length) {
    parts.push(value.slice(lastIndex));
  }

  return parts;
}

function useEnvironmentHighlight(value: unknown) {
  const { environments, activeEnvironmentId } = useEnvironmentStore();
  const activeEnvironment = environments.find(
    (environment) => environment.id === activeEnvironmentId,
  );
  const textValue = typeof value === 'string' ? value : '';
  const variableLookup = getVariableLookup(activeEnvironment?.variables ?? []);
  VARIABLE_TOKEN_REGEX.lastIndex = 0;
  const hasEnvironmentToken = VARIABLE_TOKEN_REGEX.test(textValue);

  VARIABLE_TOKEN_REGEX.lastIndex = 0;

  if (!hasEnvironmentToken) {
    return {
      highlightedContent: undefined,
      title: undefined,
    };
  }

  return {
    highlightedContent: renderEnvironmentHighlights(textValue, variableLookup),
  };
}

export function EnvironmentAwareInput({ value, title, ...props }: InputProps) {
  const highlight = useEnvironmentHighlight(value);

  return (
    <Input
      {...props}
      value={value}
      title={title}
      highlightedContent={highlight.highlightedContent}
    />
  );
}

export function EnvironmentAwareTextarea({
  value,
  title,
  className,
  ...props
}: TextareaProps) {
  const highlight = useEnvironmentHighlight(value);

  return (
    <Textarea
      {...props}
      value={value}
      title={title}
      className={className}
      highlightedContent={highlight.highlightedContent}
      highlightedContentClassName={className}
    />
  );
}
