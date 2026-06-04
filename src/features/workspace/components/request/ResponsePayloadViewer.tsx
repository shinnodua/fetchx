import type React from 'react';
import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '../../../../assets/svgs';
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../../components';

interface ResponsePayloadViewerProps {
  data: unknown;
}

type JsonPrimitive = string | number | boolean | null;

const inspectorRowClassName =
  'grid grid-cols-[minmax(8rem,0.45fr)_minmax(10rem,1fr)_auto] items-start gap-3 border-b border-foreground/10 px-3 py-2 font-mono text-xs last:border-b-0';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPrimitive = (value: unknown): value is JsonPrimitive =>
  value === null ||
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean';

const getPayloadText = (data: unknown) => {
  if (typeof data === 'string') return data;

  return JSON.stringify(data, null, 2);
};

const formatPrimitiveValue = (value: JsonPrimitive) => {
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value}"`;

  return String(value);
};

const getTypeLabel = (value: unknown) => {
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (value === null) return 'null';

  return typeof value;
};

const RawPayload: React.FC<{ data: unknown }> = ({ data }) => {
  const lines = getPayloadText(data).split('\n');

  return (
    <div className="isolate overflow-hidden rounded-xl border border-foreground/10 bg-foreground/5 [clip-path:inset(0_round_0.75rem)]">
      <div className="max-h-80 overflow-auto rounded-[inherit]">
        <pre className="grid min-w-full grid-cols-[auto_1fr] text-xs leading-5 text-foreground/80">
          {lines.map((line, index) => {
            const lineNumber = index + 1;

            return (
              <div
                key={`payload-line-${lineNumber}`}
                className="contents font-mono"
              >
                <span className="select-none border-r border-foreground/10 px-3 py-0.5 text-right text-foreground/35">
                  {lineNumber}
                </span>
                <code className="whitespace-pre px-3 py-0.5">
                  {line || ' '}
                </code>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
};

const PrimitiveValue: React.FC<{ value: JsonPrimitive }> = ({ value }) => {
  const valueClassName =
    typeof value === 'string'
      ? 'text-secondary-700 dark:text-secondary-300'
      : 'text-primary-700 dark:text-primary-300';

  return <span className={valueClassName}>{formatPrimitiveValue(value)}</span>;
};

const InspectorLabel: React.FC<{
  depth: number;
  label: string;
  isExpanded?: boolean;
  onToggle?: () => void;
}> = ({ depth, label, isExpanded, onToggle }) => (
  <span
    className="flex min-w-0 items-center gap-1.5 text-foreground/55"
    style={{ paddingLeft: `${depth * 14}px` }}
  >
    {onToggle ? (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onToggle}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${label}`}
        className="h-6 w-6 shrink-0 rounded-md p-0 text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
      >
        {isExpanded ? (
          <ChevronDownIcon
            title="Collapse node"
            className="block h-4 w-4 shrink-0 text-foreground"
            stroke="currentColor"
            strokeWidth={2.25}
          />
        ) : (
          <ChevronRightIcon
            title="Expand node"
            className="block h-4 w-4 shrink-0 text-foreground"
            stroke="currentColor"
            strokeWidth={2.25}
          />
        )}
      </Button>
    ) : (
      <span className="h-6 w-6 shrink-0" />
    )}
    <span className="truncate">{label}</span>
  </span>
);

const InspectorNode: React.FC<{
  label?: string;
  value: unknown;
  depth?: number;
  path: string;
  collapsedPaths: Set<string>;
  onToggle: (path: string) => void;
}> = ({ label, value, depth = 0, path, collapsedPaths, onToggle }) => {
  if (isPrimitive(value)) {
    return (
      <div className={inspectorRowClassName}>
        <InspectorLabel depth={depth} label={label ?? 'value'} />
        <PrimitiveValue value={value} />
        <span className="text-[10px] uppercase tracking-wider text-foreground/35">
          {getTypeLabel(value)}
        </span>
      </div>
    );
  }

  if (Array.isArray(value)) {
    const isCollapsed = collapsedPaths.has(path);
    const hasChildren = value.length > 0;

    return (
      <div>
        <div className={inspectorRowClassName}>
          <InspectorLabel
            depth={depth}
            label={label ?? 'items'}
            isExpanded={!isCollapsed}
            onToggle={hasChildren ? () => onToggle(path) : undefined}
          />
          <span className="text-foreground/80">[{value.length} items]</span>
          <span className="text-[10px] uppercase tracking-wider text-foreground/35">
            Array
          </span>
        </div>
        {!isCollapsed &&
          value.map((item, index) => {
            const itemPath = `${path}.${index}`;

            return (
              <InspectorNode
                key={itemPath}
                label={`${index}`}
                value={item}
                depth={depth + 1}
                path={itemPath}
                collapsedPaths={collapsedPaths}
                onToggle={onToggle}
              />
            );
          })}
      </div>
    );
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);
    const isCollapsed = collapsedPaths.has(path);
    const hasChildren = entries.length > 0;

    return (
      <div>
        <div className={inspectorRowClassName}>
          <InspectorLabel
            depth={depth}
            label={label ?? 'object'}
            isExpanded={!isCollapsed}
            onToggle={hasChildren ? () => onToggle(path) : undefined}
          />
          <span className="text-foreground/80">{`{${entries.length} keys}`}</span>
          <span className="text-[10px] uppercase tracking-wider text-foreground/35">
            Object
          </span>
        </div>
        {!isCollapsed &&
          entries.map(([key, childValue]) => (
            <InspectorNode
              key={`${path}.${key}`}
              label={key}
              value={childValue}
              depth={depth + 1}
              path={`${path}.${key}`}
              collapsedPaths={collapsedPaths}
              onToggle={onToggle}
            />
          ))}
      </div>
    );
  }

  return (
    <div className={inspectorRowClassName}>
      <InspectorLabel depth={depth} label={label ?? 'value'} />
      <span className="break-all text-foreground/80">{String(value)}</span>
      <span className="text-[10px] uppercase tracking-wider text-foreground/35">
        {getTypeLabel(value)}
      </span>
    </div>
  );
};

const PayloadPreview: React.FC<{ data: unknown }> = ({ data }) => {
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(
    () => new Set(),
  );

  const handleToggleNode = (path: string) => {
    setCollapsedPaths((currentPaths) => {
      const nextPaths = new Set(currentPaths);

      if (nextPaths.has(path)) {
        nextPaths.delete(path);
      } else {
        nextPaths.add(path);
      }

      return nextPaths;
    });
  };

  if (typeof data === 'string') {
    return <RawPayload data={data} />;
  }

  return (
    <div className="isolate overflow-hidden rounded-xl border border-foreground/10 bg-foreground/5 [clip-path:inset(0_round_0.75rem)]">
      <div className="max-h-80 overflow-auto rounded-[inherit]">
        <div className="sticky top-0 z-10 grid grid-cols-[minmax(8rem,0.45fr)_minmax(10rem,1fr)_auto] gap-3 rounded-t-[inherit] border-b border-foreground/10 bg-background/95 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45 backdrop-blur">
          <span>Key</span>
          <span>Value</span>
          <span>Type</span>
        </div>
        <InspectorNode
          value={data}
          path="root"
          collapsedPaths={collapsedPaths}
          onToggle={handleToggleNode}
        />
      </div>
    </div>
  );
};

export const ResponsePayloadViewer: React.FC<ResponsePayloadViewerProps> = ({
  data,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider">
          Payload Output
        </span>
        <span className="rounded-full border border-foreground/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
          {getTypeLabel(data)}
        </span>
      </div>

      <Tabs defaultValue="preview">
        <TabsList className="h-9 rounded-lg">
          <TabsTrigger value="preview" className="h-7 rounded-md px-3 text-xs">
            Preview
          </TabsTrigger>
          <TabsTrigger value="raw" className="h-7 rounded-md px-3 text-xs">
            Raw
          </TabsTrigger>
        </TabsList>
        <TabsContent value="preview" className="mt-2">
          <PayloadPreview data={data} />
        </TabsContent>
        <TabsContent value="raw" className="mt-2">
          <RawPayload data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
