import type React from 'react';
import { useState } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
} from '../../../../../components';
import { useWorkspaceStore } from '../../../../../store';
import { methodSupportsBody } from '../../../constants';
import type { RequestItem } from '../../../types';
import { beautifyJson } from '../../../utils/json';
import { RestBodyTab } from './RestBodyTab';
import { RestHeadersTab } from './RestHeadersTab';
import { RestQueryParamsTab } from './RestQueryParamsTab';

interface RestRequestSettingsProps {
  activeRequest: RequestItem;
}

export const RestRequestSettings: React.FC<RestRequestSettingsProps> = ({
  activeRequest,
}) => {
  const { toast } = useToast();
  const { updateActiveRequest } = useWorkspaceStore();
  const [restTabsByRequestId, setRestTabsByRequestId] = useState<
    Record<string, string>
  >({});
  const [jsonModeByRequestId, setJsonModeByRequestId] = useState<
    Record<string, 'text' | 'ui'>
  >({});

  const supportsBody = methodSupportsBody(activeRequest.type);
  const savedRestTab = restTabsByRequestId[activeRequest.id];
  const activeRestTab =
    supportsBody && savedRestTab === 'body'
      ? savedRestTab
      : savedRestTab === 'headers'
        ? savedRestTab
        : 'queryParams';

  const activeJsonMode = jsonModeByRequestId[activeRequest.id] || 'text';

  const handleRestTabChange = (value: string) => {
    setRestTabsByRequestId((currentTabs) => ({
      ...currentTabs,
      [activeRequest.id]: value,
    }));
  };

  const handleJsonModeChange = (mode: 'text' | 'ui') => {
    if (mode === 'ui') {
      try {
        const body = activeRequest.body?.trim();
        if (body) {
          const parsed = JSON.parse(body);
          if (
            typeof parsed !== 'object' ||
            parsed === null ||
            Array.isArray(parsed)
          ) {
            throw new Error('Only JSON objects are supported in UI mode.');
          }
        }
      } catch (e: unknown) {
        toast({
          title: 'Invalid JSON',
          description:
            (e instanceof Error ? e.message : '') ||
            'Fix the request body syntax before switching to UI mode.',
          type: 'error',
        });
        return;
      }
    }
    setJsonModeByRequestId((current) => ({
      ...current,
      [activeRequest.id]: mode,
    }));
  };

  const beautifyBody = () => {
    const body = activeRequest.body?.trim();
    if (!body) {
      toast({
        title: 'Nothing to Beautify',
        description: 'Paste a JSON request body first.',
        type: 'error',
      });
      return;
    }

    try {
      const beautified = beautifyJson(body);
      updateActiveRequest({ body: beautified });
      toast({
        title: 'Body Beautified',
        description: 'Formatted request body as JSON.',
        type: 'success',
      });
    } catch {
      toast({
        title: 'Invalid JSON',
        description: 'Fix the request body syntax before beautifying.',
        type: 'error',
      });
    }
  };

  return (
    <Tabs
      key={`${activeRequest.id}-${activeRequest.type}`}
      defaultValue="queryParams"
      value={activeRestTab}
      onValueChange={handleRestTabChange}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-foreground/10 bg-background/80 px-3 py-1 backdrop-blur">
        <h3 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">
          Request Settings
        </h3>
        <TabsList className="h-9 rounded-lg">
          <TabsTrigger
            value="queryParams"
            className="h-7 rounded-md px-3 text-xs"
          >
            Query Params
          </TabsTrigger>
          <TabsTrigger value="headers" className="h-7 rounded-md px-3 text-xs">
            Headers
          </TabsTrigger>
          {supportsBody && (
            <TabsTrigger value="body" className="h-7 rounded-md px-3 text-xs">
              Body
            </TabsTrigger>
          )}
        </TabsList>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        <RestQueryParamsTab
          queryParams={activeRequest.queryParams}
          onUpdateQueryParams={(queryParams) =>
            updateActiveRequest({ queryParams })
          }
        />

        <RestHeadersTab
          headers={activeRequest.headers}
          onUpdateHeaders={(headers) => updateActiveRequest({ headers })}
        />

        {supportsBody && (
          <RestBodyTab
            activeRequest={activeRequest}
            activeJsonMode={activeJsonMode}
            onJsonModeChange={handleJsonModeChange}
            onBeautifyBody={beautifyBody}
            onUpdateActiveRequest={updateActiveRequest}
          />
        )}
      </div>
    </Tabs>
  );
};
