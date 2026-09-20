import type React from 'react';
import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '../../../../../assets/svgs';
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../../../components';
import type { JsonPrimitive } from '../../../utils/responsePayload';
import {
  formatPrimitiveValue,
  getPayloadText,
  getTypeLabel,
  isPrimitive,
  isRecord,
} from '../../../utils/responsePayload';

export const payloadInspectorRowClassName =
  'relative grid w-full min-w-0 grid-cols-[minmax(7rem,0.45fr)_minmax(9rem,1fr)_auto] items-center gap-1.5 px-2 py-0.5 font-mono text-[11px] after:absolute after:bottom-0 after:right-0 after:left-[var(--payload-key-line-inset)] after:border-t after:border-dashed after:border-foreground/15 last:after:hidden';
export const rawPayloadCodeClassName =
  'grid min-w-full grid-cols-[auto_1fr] text-[11px] leading-4 text-foreground/80';
export const payloadPreviewCardClassName =
  'flex min-h-0 flex-1 flex-col isolate overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/5 [clip-path:inset(0_round_1rem)]';
export const getPayloadKeyLineInset = (depth: number) =>
  `calc(0.5rem + ${depth * 12 + 20}px)`;

const getRowStyle = (depth: number) =>
  ({
    '--payload-key-line-inset': getPayloadKeyLineInset(depth),
  }) as React.CSSProperties & Record<'--payload-key-line-inset', string>;

const RawPayload = ({ data }: { data: unknown }) => (
  <div className="isolate flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/5 [clip-path:inset(0_round_1rem)]">
    <div className="min-h-0 flex-1 overflow-auto rounded-[inherit]">
      <pre className={rawPayloadCodeClassName}>
        {getPayloadText(data)
          .split('\n')
          .map((line, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: line numbers are stable display rows
              key={`payload-line-${index + 1}`}
              className="contents font-mono"
            >
              <span className="select-none border-r border-foreground/10 px-2 py-0.5 text-right text-foreground/35">
                {index + 1}
              </span>
              <code className="whitespace-pre px-2 py-0.5">{line || ' '}</code>
            </div>
          ))}
      </pre>
    </div>
  </div>
);

const InspectorLabel = ({
  depth,
  isExpanded,
  label,
  onToggle,
}: {
  depth: number;
  isExpanded?: boolean;
  label: string;
  onToggle?: () => void;
}) => (
  <span
    className="flex min-w-0 items-center gap-1 text-foreground/55"
    style={{ paddingLeft: `${depth * 12}px` }}
  >
    {onToggle ? (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onToggle}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${label}`}
        className="h-4 w-4 shrink-0 rounded p-0 text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
      >
        {isExpanded ? (
          <ChevronDownIcon
            title="Collapse node"
            className="block h-3 w-3 shrink-0 text-foreground"
            stroke="currentColor"
            strokeWidth={2.25}
          />
        ) : (
          <ChevronRightIcon
            title="Expand node"
            className="block h-3 w-3 shrink-0 text-foreground"
            stroke="currentColor"
            strokeWidth={2.25}
          />
        )}
      </Button>
    ) : (
      <span className="h-4 w-4 shrink-0" />
    )}
    <span className="truncate">{label}</span>
  </span>
);

const TypeLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[10px] uppercase tracking-wider text-foreground/35 text-right justify-self-end">
    {children}
  </span>
);

const InspectorNode = ({
  depth = 0,
  expandedPaths,
  label,
  onToggle,
  path,
  value,
}: {
  depth?: number;
  expandedPaths: Set<string>;
  label?: string;
  onToggle: (path: string) => void;
  path: string;
  value: unknown;
}): React.ReactNode => {
  if (isPrimitive(value)) {
    const colorClass =
      typeof value === 'string'
        ? 'text-secondary-700 dark:text-secondary-300'
        : 'text-primary-700 dark:text-primary-300';
    return (
      <div className={payloadInspectorRowClassName} style={getRowStyle(depth)}>
        <InspectorLabel depth={depth} label={label ?? 'value'} />
        <span className={`min-w-0 w-full break-all ${colorClass}`}>
          {formatPrimitiveValue(value as JsonPrimitive)}
        </span>
        <TypeLabel>{getTypeLabel(value)}</TypeLabel>
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const entries = isRecord(value) ? Object.entries(value) : null;
  if (isArray || entries) {
    const children: unknown[] = isArray ? value : (entries ?? []);
    const isExpanded = expandedPaths.has(path);
    return (
      <div>
        <div
          className={payloadInspectorRowClassName}
          style={getRowStyle(depth)}
        >
          <InspectorLabel
            depth={depth}
            label={label ?? (isArray ? 'items' : 'object')}
            isExpanded={isExpanded}
            onToggle={children.length > 0 ? () => onToggle(path) : undefined}
          />
          <span className="text-foreground/80">
            {isArray
              ? `[${children.length} items]`
              : `{${children.length} keys}`}
          </span>
          <TypeLabel>{isArray ? 'Array' : 'Object'}</TypeLabel>
        </div>
        {isExpanded &&
          children.map((child, index) => {
            const [key, childValue] = isArray
              ? [String(index), child]
              : (child as [string, unknown]);
            const childPath = `${path}.${key}`;
            return (
              <InspectorNode
                key={childPath}
                label={key}
                value={childValue}
                depth={depth + 1}
                path={childPath}
                expandedPaths={expandedPaths}
                onToggle={onToggle}
              />
            );
          })}
      </div>
    );
  }

  return (
    <div className={payloadInspectorRowClassName} style={getRowStyle(depth)}>
      <InspectorLabel depth={depth} label={label ?? 'value'} />
      <span className="min-w-0 w-full break-all text-foreground/80">
        {String(value)}
      </span>
      <TypeLabel>{getTypeLabel(value)}</TypeLabel>
    </div>
  );
};

const PayloadPreview = ({ data }: { data: unknown }) => {
  const [expandedPaths, setExpandedPaths] = useState(() => new Set(['root']));
  if (typeof data === 'string') return <RawPayload data={data} />;
  return (
    <div className={payloadPreviewCardClassName}>
      <div className="flex min-h-0 flex-1 w-full overflow-auto rounded-[inherit]">
        <div className="w-full min-w-0 flex flex-col">
          <div className="sticky top-0 z-10 grid w-full min-w-0 grid-cols-[minmax(7rem,0.45fr)_minmax(9rem,1fr)_auto] items-center gap-1.5 rounded-t-[inherit] border-b border-foreground/10 bg-background/95 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-foreground/45 backdrop-blur">
            <span>Key</span>
            <span>Value</span>
            <span className="text-right justify-self-end">Type</span>
          </div>
          <InspectorNode
            value={data}
            path="root"
            expandedPaths={expandedPaths}
            onToggle={(path) =>
              setExpandedPaths((current) => {
                const next = new Set(current);
                if (next.has(path)) next.delete(path);
                else next.add(path);
                return next;
              })
            }
          />
        </div>
      </div>
    </div>
  );
};

export const PayloadTabs = ({
  data,
  actions,
}: {
  data: unknown;
  actions?: React.ReactNode;
}) => (
  <Tabs defaultValue="preview" className="flex min-h-0 flex-1 flex-col">
    <div className="flex flex-wrap items-center justify-between gap-1.5">
      <TabsList className="h-8 rounded-lg">
        <TabsTrigger
          value="preview"
          className="h-6 rounded-md px-2 text-[10px]"
        >
          Preview
        </TabsTrigger>
        <TabsTrigger value="raw" className="h-6 rounded-md px-2 text-[10px]">
          Raw
        </TabsTrigger>
      </TabsList>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </div>
    <TabsContent value="preview" className="mt-1 flex min-h-0 flex-1 flex-col">
      <PayloadPreview data={data} />
    </TabsContent>
    <TabsContent value="raw" className="mt-1 flex min-h-0 flex-1 flex-col">
      <RawPayload data={data} />
    </TabsContent>
  </Tabs>
);
