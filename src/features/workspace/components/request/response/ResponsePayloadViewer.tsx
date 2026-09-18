import type React from 'react';
import { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
} from '../../../../../assets/svgs';
import {
  Button,
  Dialog,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast,
} from '../../../../../components';
import { trackEvent } from '../../../../../services/analytics/googleAnalytics';
import { openExternalUrl } from '../../../../../services/platform';
import type { JsonPrimitive } from '../../../utils/responsePayload';
import {
  createDefaultResponseName,
  formatPrimitiveValue,
  getPayloadText,
  getTypeLabel,
  isPrimitive,
  isRecord,
} from '../../../utils/responsePayload';

interface ResponsePayloadViewerProps {
  data: unknown;
  onSave?: (name: string) => boolean;
  explorerUrl?: string;
}

export const payloadInspectorRowClassName =
  'relative grid w-full min-w-0 grid-cols-[minmax(7rem,0.45fr)_minmax(9rem,1fr)_auto] items-center gap-1.5 px-2 py-0.5 font-mono text-[11px] after:absolute after:bottom-0 after:right-0 after:left-[var(--payload-key-line-inset)] after:border-t after:border-dashed after:border-foreground/15 last:after:hidden';

export const rawPayloadCodeClassName =
  'grid min-w-full grid-cols-[auto_1fr] text-[11px] leading-4 text-foreground/80';

export const payloadPreviewCardClassName =
  'flex min-h-0 flex-1 flex-col isolate overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/5 [clip-path:inset(0_round_1rem)]';

export const getPayloadKeyLineInset = (depth: number) =>
  `calc(0.5rem + ${depth * 12 + 20}px)`;

const getPayloadInspectorRowStyle = (depth: number) =>
  ({
    '--payload-key-line-inset': getPayloadKeyLineInset(depth),
  }) as React.CSSProperties & Record<'--payload-key-line-inset', string>;

const RawPayload: React.FC<{
  data: unknown;
}> = ({ data }) => {
  const lines = getPayloadText(data).split('\n');

  return (
    <div className="isolate flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/5 [clip-path:inset(0_round_1rem)]">
      <div className="min-h-0 flex-1 overflow-auto rounded-[inherit]">
        <pre className={rawPayloadCodeClassName}>
          {lines.map((line, index) => {
            const lineNumber = index + 1;

            return (
              <div
                key={`payload-line-${lineNumber}`}
                className="contents font-mono"
              >
                <span className="select-none border-r border-foreground/10 px-2 py-0.5 text-right text-foreground/35">
                  {lineNumber}
                </span>
                <code className="whitespace-pre px-2 py-0.5">
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
  const colorClass =
    typeof value === 'string'
      ? 'text-secondary-700 dark:text-secondary-300'
      : 'text-primary-700 dark:text-primary-300';

  return (
    <span className={`min-w-0 break-all w-full block ${colorClass}`}>
      {formatPrimitiveValue(value)}
    </span>
  );
};

const InspectorLabel: React.FC<{
  depth: number;
  label: string;
  isExpanded?: boolean;
  onToggle?: () => void;
}> = ({ depth, label, isExpanded, onToggle }) => (
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

const InspectorNode: React.FC<{
  label?: string;
  value: unknown;
  depth?: number;
  path: string;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
}> = ({ label, value, depth = 0, path, expandedPaths, onToggle }) => {
  if (isPrimitive(value)) {
    return (
      <div
        className={payloadInspectorRowClassName}
        style={getPayloadInspectorRowStyle(depth)}
      >
        <InspectorLabel depth={depth} label={label ?? 'value'} />
        <PrimitiveValue value={value} />
        <span className="text-[10px] uppercase tracking-wider text-foreground/35 text-right justify-self-end">
          {getTypeLabel(value)}
        </span>
      </div>
    );
  }

  if (Array.isArray(value)) {
    const isExpanded = expandedPaths.has(path);
    const hasChildren = value.length > 0;

    return (
      <div>
        <div
          className={payloadInspectorRowClassName}
          style={getPayloadInspectorRowStyle(depth)}
        >
          <InspectorLabel
            depth={depth}
            label={label ?? 'items'}
            isExpanded={isExpanded}
            onToggle={hasChildren ? () => onToggle(path) : undefined}
          />
          <span className="text-foreground/80">[{value.length} items]</span>
          <span className="text-[10px] uppercase tracking-wider text-foreground/35 text-right justify-self-end">
            Array
          </span>
        </div>
        {isExpanded &&
          value.map((item, index) => {
            const itemPath = `${path}.${index}`;

            return (
              <InspectorNode
                key={itemPath}
                label={`${index}`}
                value={item}
                depth={depth + 1}
                path={itemPath}
                expandedPaths={expandedPaths}
                onToggle={onToggle}
              />
            );
          })}
      </div>
    );
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);
    const isExpanded = expandedPaths.has(path);
    const hasChildren = entries.length > 0;

    return (
      <div>
        <div
          className={payloadInspectorRowClassName}
          style={getPayloadInspectorRowStyle(depth)}
        >
          <InspectorLabel
            depth={depth}
            label={label ?? 'object'}
            isExpanded={isExpanded}
            onToggle={hasChildren ? () => onToggle(path) : undefined}
          />
          <span className="text-foreground/80">{`{${entries.length} keys}`}</span>
          <span className="text-[10px] uppercase tracking-wider text-foreground/35 text-right justify-self-end">
            Object
          </span>
        </div>
        {isExpanded &&
          entries.map(([key, childValue]) => (
            <InspectorNode
              key={`${path}.${key}`}
              label={key}
              value={childValue}
              depth={depth + 1}
              path={`${path}.${key}`}
              expandedPaths={expandedPaths}
              onToggle={onToggle}
            />
          ))}
      </div>
    );
  }

  return (
    <div
      className={payloadInspectorRowClassName}
      style={getPayloadInspectorRowStyle(depth)}
    >
      <InspectorLabel depth={depth} label={label ?? 'value'} />
      <span className="min-w-0 break-all w-full block text-foreground/80">
        {String(value)}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-foreground/35 text-right justify-self-end">
        {getTypeLabel(value)}
      </span>
    </div>
  );
};

const PayloadPreview: React.FC<{
  data: unknown;
}> = ({ data }) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(['root']),
  );

  const handleToggleNode = (path: string) => {
    setExpandedPaths((currentPaths) => {
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
            onToggle={handleToggleNode}
          />
        </div>
      </div>
    </div>
  );
};

const PayloadTabs: React.FC<{
  data: unknown;
  actions?: React.ReactNode;
}> = ({ data, actions }) => (
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

export const ResponsePayloadDialog: React.FC<{
  data: unknown;
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
}> = ({ data, isOpen, onClose, title = 'Payload Output' }) => {
  const { toast } = useToast();

  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(getPayloadText(data));
      toast({
        title: 'Copied to Clipboard',
        description: 'Response payload copied successfully.',
        type: 'success',
      });
    } catch {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy response payload to clipboard.',
        type: 'error',
      });
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={getTypeLabel(data)}
      className="flex h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-none flex-col overflow-hidden"
    >
      <PayloadTabs
        data={data}
        actions={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyPayload}
            className="h-7 gap-1.5 rounded-lg px-2 text-[10px] font-semibold uppercase tracking-wider text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200"
          >
            <CopyIcon
              title="Copy response payload"
              className="h-3.5 w-3.5 shrink-0"
              strokeWidth={1.5}
            />
            Copy
          </Button>
        }
      />
    </Dialog>
  );
};

export const ResponsePayloadViewer: React.FC<ResponsePayloadViewerProps> = ({
  data,
  onSave,
  explorerUrl,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [responseName, setResponseName] = useState(createDefaultResponseName);

  const openSaveDialog = () => {
    setResponseName(createDefaultResponseName());
    setIsSaveDialogOpen(true);
  };

  const handleSaveResponse = () => {
    trackEvent({ screen: 'workspace', action: 'save_response' });
    const didSave = onSave?.(responseName) ?? false;
    if (didSave) {
      setIsSaveDialogOpen(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-1.5">
        <span className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider">
          Payload Output
        </span>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full border border-foreground/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-foreground/40">
            {getTypeLabel(data)}
          </span>
        </div>
      </div>

      <PayloadTabs
        data={data}
        actions={
          <>
            {explorerUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => openExternalUrl(explorerUrl)}
                className="h-7 rounded-lg px-2 text-[10px] font-semibold uppercase tracking-wider text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200"
              >
                Explorer
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="h-7 rounded-lg px-2 text-[10px] font-semibold uppercase tracking-wider text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200"
            >
              Expand
            </Button>
            {onSave && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={openSaveDialog}
                className="h-7 rounded-lg px-2 text-[10px] font-semibold uppercase tracking-wider text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200"
              >
                Save
              </Button>
            )}
          </>
        }
      />

      <ResponsePayloadDialog
        data={data}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />

      {onSave && (
        <Dialog
          isOpen={isSaveDialogOpen}
          onClose={() => setIsSaveDialogOpen(false)}
          title="Save Response"
          description="Name this response before saving it under the request."
        >
          <div className="space-y-4">
            <Input
              value={responseName}
              onChange={(event) => setResponseName(event.target.value)}
              placeholder="Response name"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsSaveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveResponse}
                disabled={!responseName.trim()}
              >
                Save Response
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
